const express = require('express');
const db = require('../../database/db');
const authenticateToken = require('../../utils/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query('SELECT id, email, role_id FROM "user" WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      message: 'User info retrieved successfully',
      user: {
        id: user.id,
        email: user.email,
        roleId: user.role_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
