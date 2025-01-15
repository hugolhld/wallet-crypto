const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const authenticateToken = require('../../utils/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query('SELECT favorite_currency FROM "user" WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Favorite currency not found' });
        }
        const favoriteCurrency = result.rows[0];
        console.log(favoriteCurrency)
        res.status(200).json(favoriteCurrency);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { favorite_currency } = req.body;

    try {
        await db.query('UPDATE "user" SET favorite_currency = $1 WHERE id = $2', [favorite_currency, userId]);
        res.status(200).json({ message: 'Favorite currency updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
