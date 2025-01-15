const express = require('express');
const db = require('../../database/db');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/', async (req, res) => {
//   const { refreshToken } = req.body;

//   take refreshToken from cookies
  const refreshToken = req.cookies['refreshToken'];
//   console.log(refreshToken2)


  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Vérifier si le token de rafraîchissement existe dans la base de données
    const tokenResult = await db.query(
      'SELECT * FROM "refresh" WHERE token = $1 AND expiredAt > NOW()',
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenData = tokenResult.rows[0];

    // Générer un nouveau token d'accès
    const accessToken = jwt.sign(
      { id: tokenData.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
