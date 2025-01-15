var express = require('express');
var router = express.Router();
const db = require('../database/db');

router.get('/', async function(req, res, next) {
  // res.status(200).json({ message: 'Welcome to the home page!' });
  try {
    const result = await db.query('SELECT * FROM role');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

module.exports = router;
