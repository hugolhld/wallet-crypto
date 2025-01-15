const express = require('express');
const db = require('../../database/db');
const transporter = require('../../utils/mailSender')
const router = express.Router();

router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userResult = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.is_confirmed) {
      return res.status(400).json({ error: 'User is already confirmed' });
    }

    let token = user.confirmed_token;
    if (!token) {
      token = require('crypto').randomBytes(32).toString('hex');
      await db.query('UPDATE "user" SET confirmed_token = $1 WHERE id = $2', [token, user.id]);
    }

    const activationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    await transporter.sendMail({
      from: '"YourAppName" <no-reply@yourapp.com>',
      to: email,
      subject: 'Resend Activation Link',
      html: `<p>Click the link below to activate your account:</p>
             <a href="${activationLink}">${activationLink}</a>`,
    });

    res.status(200).json({ message: 'Activation link resent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
