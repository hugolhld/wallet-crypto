const express = require('express');
const crypto = require('crypto');
const transporter = require('../../utils/mailSender');
const db = require('../../database/db');
const router = express.Router();

router.post('/', async (req, res) => {
    const { email } = req.body;

    try {
        // Vérifier si l'email existe dans la base de données
        const result = await db.query('SELECT id FROM "user" WHERE email = $1', [email]);
        const user = result.rows[0];
        console.log(user)
        if (!user) {
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiration = new Date(Date.now() + 15 * 60 * 1000); // Token valide 15 minutes

        const existingToken = await db.query(
            'SELECT id FROM password_reset_tokens WHERE user_id = $1',
            [user.id]
        );

        if (existingToken.rows.length > 0) {
            await db.query(
                `UPDATE password_reset_tokens 
                 SET token = $1, expires_at = $2
                 WHERE user_id = $3`,
                [token, expiration, user.id]
            );
        } else {
            await db.query(
                `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
                 VALUES ($1, $2, $3)`,
                [user.id, token, expiration]
            );
        }

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        await transporter.sendMail({
            from: 'MyApp <my@app.fr>',
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link below to reset your password: ${resetLink}`,
            html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                   <a href="${resetLink}">Reset Password</a>
                   <p>This link will expire in 15 minutes.</p>`,
        });

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
