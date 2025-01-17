const express = require('express');
const querystring = require('querystring');
const fetchData = require('../../utils/fetchHttps');
const db = require('../../database/db');
const { ethers } = require('ethers');


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

        if (response.status !== '1' /* || response.result.length === 0 */) {
            // console.log('No more transactions to fetch.');
            console.log(response.status);
            hasMore = false;
            break;
        }

        const transactions = response.result;

        const newTransactions = transactions.filter(tx => !seenTransactions.has(tx.hash));
        newTransactions.forEach(tx => seenTransactions.add(tx.hash));

        if (newTransactions.length === 0) {
            console.log('No new transactions to fetch.');
            hasMore = false;
            break;
        }

        allTransactions.push(...newTransactions);

        console.log(`Fetched ${newTransactions.length} new transactions starting from block ${currentStartBlock}`);

        currentStartBlock = parseInt(transactions[transactions.length - 1].blockNumber, 10);
    }

    return allTransactions;
};

const fetchValidatedBlocks = async (wallet, etherscanApiKey) => {
    const baseParams = {
        module: 'account',
        action: 'getminedblocks',
        address: wallet,
        blocktype: 'blocks',
        apikey: etherscanApiKey,
    };
    const queryString = querystring.stringify(baseParams);

    const response = await fetchData('api.etherscan.io', `/api?${queryString}`);
    if (response.status !== '1') {
        console.error('Failed to fetch validated blocks:', response.message);
        return [];
    }
    return response.result;
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

        const validatedBlocks = await fetchValidatedBlocks(wallet, etherscanApiKey);

        const allTransactions = [...normalTransactions, ...internalTransactions];

        validatedBlocks.forEach(block => {
            allTransactions.push({
                timeStamp: block.timeStamp,
                value: block.blockReward,
                from: 'mining',
                to: wallet.toLowerCase(),
                gasUsed: '0',
                gasPrice: '0',
                hash: `block-${block.blockNumber}`,
                blockNumber: block.blockNumber,
            });
        });

        allTransactions.sort((a, b) => a.timeStamp - b.timeStamp);

        console.log(`Total unique transactions fetched: ${allTransactions.length}`);

        let startBalanceWei = BigInt(0);
        const cumulativeBalances = allTransactions.map((tx) => {
            const valueWei = BigInt(tx.value);
            const gasFeeWei = tx.gasUsed && tx.gasPrice ? BigInt(tx.gasUsed) * BigInt(tx.gasPrice) : BigInt(0);

            if (tx.from.toLowerCase() === wallet.toLowerCase()) {
                startBalanceWei -= valueWei + gasFeeWei;
            } else if (tx.to.toLowerCase() === wallet.toLowerCase()) {
                startBalanceWei += valueWei;
            }

            return {
                date: new Date(tx.timeStamp * 1000).toISOString().split('T')[0],
                cumulative_balance_wei: startBalanceWei.toString(),
            };
        });

        const consolidatedBalances = cumulativeBalances.reduce((acc, balance) => {
            const existingEntry = acc.find((entry) => entry.date === balance.date);
            if (existingEntry) {
                existingEntry.cumulative_balance_wei = balance.cumulative_balance_wei;
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
                wei: balance.cumulative_balance_eth,
                cumulative_balance_eth: ethers.formatEther(balance.cumulative_balance_wei),
                cumulative_balance_currency: priceInCurrency
                    ? Number((Number(ethers.formatEther(balance.cumulative_balance_wei)) * priceInCurrency.close).toFixed(2))
                    : null,
                price: priceInCurrency ? priceInCurrency.close : null
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
