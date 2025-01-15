const express = require('express');
const querystring = require('querystring');
const authenticateToken = require('../../utils/authMiddleware');
const db = require('../../database/db');

const router = express.Router();

const fetchData = require('../../utils/fetchHttps');

router.get('/:currency/:wallet', authenticateToken, async (req, res) => {
    // const { id: userId } = req.user;
    const { currency, wallet } = req.params;

    console.log(req.params)

    try {
        // const userResult = await db.query('SELECT wallet FROM wallets WHERE user_id = $1', [userId]);
        const address = wallet;

        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
        const etherscanParams = querystring.stringify({
            module: 'account',
            action: 'txlist',
            address,
            startblock: 0,
            endblock: 99999999,
            page: 1,
            offset: 10000, // Large offset pour éviter de manquer des transactions
            sort: 'asc',
            apikey: etherscanApiKey,
        });

        const etherscanResponse = await fetchData('api.etherscan.io', `/api?${etherscanParams}`);
        if (etherscanResponse.status !== '1') {
            return res.status(400).json({ error: etherscanResponse.message || 'Failed to fetch transaction data' });
        }

        const etherscanTransactions = etherscanResponse.result;
        const etherscanTxCount = etherscanTransactions.length;

        const dbResult = await db.query(
            `SELECT COUNT(*) AS tx_count FROM pricing WHERE address = $1 AND currency = $2`,
            [address, currency]
        );
        const dbTxCount = parseInt(dbResult.rows[0].tx_count, 10);

        if (etherscanTxCount === dbTxCount) {
            const cachedData = await db.query(
                `SELECT
                    address,
                    TO_CHAR(date, 'YYYY-MM-DD') AS date, -- Formate la date pour l'affichage
                    transaction_hash,
                    value_eth,
                    price_in_currency,
                    value_in_currency,
                    currency
                FROM pricing
                WHERE address = $1 AND currency = $2
                ORDER BY date ASC
            `,
                [address, currency]
            );
            return res.status(200).json({ message: 'Data retrieved from cache', data: cachedData.rows });
        }

        const cryptocompareParams = querystring.stringify({
            fsym: 'ETH',
            tsym: currency.toUpperCase(),
            limit: 2000,
            api_key: process.env.CRYPTOCOMPARE_API_KEY,
        });

        const cryptocompareResponse = await fetchData('min-api.cryptocompare.com', `/data/v2/histoday?${cryptocompareParams}`);
        if (cryptocompareResponse.Response !== 'Success') {
            return res.status(400).json({ error: cryptocompareResponse.Message || 'Failed to fetch price data' });
        }

        const priceHistory = cryptocompareResponse.Data.Data;

        const walletData = [];
        for (const tx of etherscanTransactions) {
            const txDate = new Date(tx.timeStamp * 1000).toISOString().split('T')[0];
            const priceInfo = priceHistory.find((price) => {
                const priceDate = new Date(price.time * 1000).toISOString().split('T')[0];
                return priceDate === txDate;
            });

            const valueETH = parseFloat(tx.value) / 10 ** 18;
            const priceInCurrency = priceInfo ? priceInfo.close : null;
            const valueInCurrency = priceInCurrency ? valueETH * priceInCurrency : null;

            walletData.push({
                address,
                date: txDate,
                transaction_hash: tx.hash,
                value_eth: valueETH,
                currency,
                price_in_currency: priceInCurrency,
                value_in_currency: valueInCurrency,
            });
        }

        for (const data of walletData) {
            const existingEntry = await db.query(
                `SELECT * FROM pricing 
                 WHERE address = $1 AND date = $2 AND transaction_hash = $3 AND currency = $4`,
                [data.address, data.date, data.transaction_hash, currency.toUpperCase()]
            );

            if (existingEntry.rows.length === 0) {
                await db.query(
                    `INSERT INTO pricing (address, date, transaction_hash, value_eth, price_in_currency, value_in_currency, currency)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        data.address,              // $1
                        data.date,                // $2
                        data.transaction_hash,     // $3
                        data.value_eth,            // $4
                        data.price_in_currency,     // $5
                        data.value_in_currency,     // $6
                        currency.toUpperCase(),   // $7
                    ]
                );
            }
        }

        console.log(walletData)

        res.status(200).json({ message: 'Data updated and retrieved', data: walletData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
