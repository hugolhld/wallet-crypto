const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const authenticateToken = require('../../utils/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.status(200).json(result.rows.map(row => row.wallet));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { wallet } = req.body;

    try {
        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1 AND wallet = $2', [userId, wallet]);

        if (result.rows.length > 0) {
            res.status(400).json({ error: 'Wallet already exists' });
        } else {
            await db.query('INSERT INTO wallets (wallet, user_id) VALUES ($1, $2)', [wallet, userId]);
            res.status(201).json({ message: 'Wallet created successfully' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:wallet', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { wallet } = req.params;

    try {
        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1 AND wallet = $2', [userId, wallet]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        await db.query('DELETE FROM wallets WHERE user_id = $1 AND wallet = $2', [userId, wallet]);
        res.status(200).json({ message: 'Wallet deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
