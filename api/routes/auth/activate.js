var express = require('express');
var router = express.Router();
const db = require('../../database/db');

router.get('/:token', async function(req, res, next) {
    const { token } = req.params;

    try {
      const userResult = await db.query('SELECT * FROM "user" WHERE confirmed_token = $1', [token]);

      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const user = userResult.rows[0];

      await db.query('UPDATE "user" SET is_confirmed = true, confirmed_token = NULL WHERE id = $1', [user.id]);

      res.status(200).json({ message: 'Email confirmed successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
