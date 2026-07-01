const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const quotesPath = path.join(__dirname, '..', 'data', 'quotes.json');
const QUOTES = JSON.parse(fs.readFileSync(quotesPath, 'utf-8'));

function getDailyQuote(seed) {
  const idx = seed % QUOTES.length;
  return QUOTES[idx];
}

// GET /api/quotes/today?date=2026-07-01
router.get('/today', (req, res) => {
  try {
    const { date } = req.query;
    const d = date || new Date().toISOString().slice(0, 10);
    const seed = d.split('-').reduce((a, b) => a + parseInt(b), 0);
    const quote = getDailyQuote(seed);
    res.json({ date, quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
