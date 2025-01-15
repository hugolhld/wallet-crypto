const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../../database/db');
const transporter = require('../../utils/mailSender');
const crypto = require('crypto');

const router = express.Router();

router.post(
    '/',
    [
        body('email').isEmail().withMessage('Email is not valid'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role_id } = req.body;

        try {
            const existingUser = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const confirmatedToken = crypto.randomBytes(20).toString('hex');

            const result = await db.query(
                'INSERT INTO "user" (email, password, role_id, confirmed_token) VALUES ($1, $2, $3, $4) RETURNING id, email',
                [email, hashedPassword, 2, confirmatedToken]
            );

            const newUser = result.rows[0];

            const confirmationUrl = `${process.env.FRONTEND_URL}/verify-email/${confirmatedToken}`;

            console.log(confirmationUrl)

            const mailOptions = {
                // from: process.env.EMAIL_USER,
                from: 'hello@demomailtrap.com',
                to: email,
                subject: 'Email Confirmation',
                html: `<p>Thank you for signing up! Please confirm your email by clicking the link below:</p>
               <a href="${confirmationUrl}">Confirm Email</a>`,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else if (info) {
                    console.log('coucou')
                    console.log('Email sent: ' + info.response);
                }
            });

            res.status(201).json({
                message: 'User created successfully. Please check your email for confirmation.',
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

module.exports = router;
