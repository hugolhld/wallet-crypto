const express = require('express');
const querystring = require('querystring');
const fetchData = require('../../utils/fetchHttps');
// const db = require('../../database/db');

const router = express.Router();

const fetchIncrementalTransactions = async (baseParams, baseUrl) => {
    let allTransactions = [];
    let currentStartBlock = 0;
    let hasMore = true;
    const seenTransactions = new Set();

    while (hasMore) {
        const blockParams = { ...baseParams, startblock: currentStartBlock };
        const queryString = querystring.stringify(blockParams);
        const response = await fetchData(baseUrl, `/api?${queryString}`);

        if (response.status !== '1' || response.result.length === 0) {
            console.log('No more transactions to fetch.');
            hasMore = false;
            break;
        }

        const transactions = response.result;

        const newTransactions = transactions.filter(tx => !seenTransactions.has(tx.hash));
        newTransactions.forEach(tx => seenTransactions.add(tx.hash));

        allTransactions = [...allTransactions, ...newTransactions];

        // console.log(allTransactions)

        console.log(`Fetched ${newTransactions.length} new transactions starting from block ${currentStartBlock}`);

        currentStartBlock = parseInt(transactions[transactions.length - 1].blockNumber, 10);
    }

    return allTransactions;
};

router.get('/wallet-evolution/:currency/:wallet', async (req, res) => {
    const { currency, wallet } = req.params;

    try {
        if (!wallet) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

        const baseParams = {
            module: 'account',
            address: wallet,
            sort: 'asc',
            apikey: etherscanApiKey,
        };

        console.log(`Fetching transactions for wallet: ${wallet}`);

        const normalTransactions = await fetchIncrementalTransactions(
            { ...baseParams, action: 'txlist' },
            'api.etherscan.io'
        );

        const internalTransactions = await fetchIncrementalTransactions(
            { ...baseParams, action: 'txlistinternal' },
            'api.etherscan.io'
        );

        const allTransactions = [...normalTransactions, ...internalTransactions];
        console.log(allTransactions)
        console.log(`Total unique transactions fetched: ${allTransactions.length}`);

        let startBalance = 0;
        const cumulativeBalances = allTransactions.map((tx) => {
            const valueETH = parseFloat(tx.value) / 10 ** 18;
            const gasFee = tx.gas && tx.gasPrice ? (parseFloat(tx.gas) * parseFloat(tx.gasPrice)) / 10 ** 18 : 0;

            if (tx.from.toLowerCase() === wallet.toLowerCase()) {
                startBalance -= valueETH + gasFee;
            } else {
                startBalance += valueETH;
            }

            return {
                date: new Date(tx.timeStamp * 1000).toISOString().split('T')[0],
                cumulative_balance_eth: Math.max(startBalance, 0),
            };
        });

        const consolidatedBalances = cumulativeBalances.reduce((acc, balance) => {
            const existingEntry = acc.find((entry) => entry.date === balance.date);
            if (existingEntry) {
                existingEntry.cumulative_balance_eth = balance.cumulative_balance_eth;
            } else {
                acc.push({ ...balance });
            }
            return acc;
        }, []);

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

        const walletEvolution = consolidatedBalances.map((balance) => {
            const priceInCurrency = priceHistory.find((price) => {
                const priceDate = new Date(price.time * 1000).toISOString().split('T')[0];
                return priceDate === balance.date;
            });

            return {
                date: balance.date,
                cumulative_balance_eth: balance.cumulative_balance_eth,
                cumulative_balance_currency: priceInCurrency
                    ? balance.cumulative_balance_eth * priceInCurrency.close
                    : null,
            };
        });

        res.status(200).json({
            message: 'Wallet evolution retrieved successfully',
            data: walletEvolution,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
