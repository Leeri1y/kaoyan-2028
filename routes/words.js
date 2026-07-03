const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDB } = require('../db/database');
const { dateSeed } = require('../utils/dateSeed');

// Load word bank
const wordsPath = path.join(__dirname, '..', 'data', 'words.json');
const WORDS = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));

// Seeded pseudo-random for deterministic daily selection
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getDailyWords(seed, count = 20) {
  const rng = seededRandom(seed);
  const indices = new Set();
  while (indices.size < count && indices.size < WORDS.length) {
    const idx = Math.floor(rng() * WORDS.length);
    indices.add(idx);
  }
  return Array.from(indices).map(i => WORDS[i]);
}

// GET /api/words/today?date=2026-07-01
router.get('/today', (req, res) => {
  try {
    const { date } = req.query;
    const d = date || new Date().toISOString().slice(0, 10);
    const seed = dateSeed(d);
    const words = getDailyWords(seed, 20);
    res.json({ date, words, total: words.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/words/review?date=2026-07-01  (return last 3 days words)
router.get('/review', (req, res) => {
  try {
    const { date } = req.query;
    const d = date ? new Date(date) : new Date();
    const results = [];
    for (let i = 0; i < 3; i++) {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().slice(0, 10);
      const seed = dateSeed(ds);
      const words = getDailyWords(seed, 20);
      results.push({ date: ds, words });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/words/bank  - return word count info
router.get('/bank', (req, res) => {
  const subjects = {};
  WORDS.forEach(w => {
    subjects[w.subject] = (subjects[w.subject] || 0) + 1;
  });
  res.json({ total: WORDS.length, subjects });
});

module.exports = router;
