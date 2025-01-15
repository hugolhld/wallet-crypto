const express = require('express');
const db = require('../../database/db');
const authenticateToken = require('../../utils/authMiddleware');

const router = express.Router();

router.delete('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Supprime tous les tokens de rafraîchissement liés à cet utilisateur
    await db.query('DELETE FROM refresh WHERE user_id = $1', [userId]);

    res.status(200).json({ message: 'Logout successful, refresh tokens revoked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
