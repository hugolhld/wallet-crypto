const bcrypt = require('bcrypt');
const express = require('express');
const db = require('../../database/db');

const router = express.Router();

router.post('/', async (req, res) => {
    const { token, password } = req.body;

    try {
        const result = await db.query(
            `SELECT user_id, expires_at 
             FROM password_reset_tokens 
             WHERE token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const { user_id, expires_at } = result.rows[0];

        if (new Date() > new Date(expires_at)) {
            return res.status(400).json({ error: 'Token has expired' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `UPDATE "user"
             SET password = $1 
             WHERE id = $2`,
            [hashedPassword, user_id]
        );

        await db.query(
            `DELETE FROM password_reset_tokens 
             WHERE token = $1`,
            [token]
        );

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
