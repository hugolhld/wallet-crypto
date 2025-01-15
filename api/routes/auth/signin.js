const express = require('express');
const db = require('../../database/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const router = express.Router();

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const userResult = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        if (!user.is_confirmed) {
            return res.status(400).json({ error: 'Please confirm your email before signing in' });
        }

        const now = new Date();
        if (user.locked_until && user.locked_until > now) {
            return res.status(403).json({
                error: `Account is locked until ${user.locked_until}`,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {

            await db.query('UPDATE "user" SET failed_attempts = failed_attempts + 1 WHERE email = $1', [email]);

            if (user.failed_attempts + 1 >= MAX_ATTEMPTS) {
                const lockUntil = new Date(now.getTime() + LOCK_TIME);  // Verrouillage de 15 minutes
                await db.query('UPDATE "user" SET locked_until = $1 WHERE email = $2', [lockUntil, email]);
                return res.status(403).json({ error: `Account locked until ${lockUntil}` });
            }

            return res.status(403).json({ error: 'Invalid email or password' });
        }

        await db.query('UPDATE "user" SET failed_attempts = 0, locked_until = NULL WHERE email = $1', [email]);

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomBytes(64).toString('hex');

        const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
        await db.query(
            'INSERT INTO "refresh" (token, expiredat, user_id) VALUES ($1, $2, $3)',
            [refreshToken, expiredAt, user.id]
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            expires: expiredAt,
        });

        res.status(200).json({
            message: 'Signed in successfully',
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
