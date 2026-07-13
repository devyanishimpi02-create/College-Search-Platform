const express = require('express');
const router = express.Router();
const db = require('../db');

// Map exam name from frontend -> actual DB column
const EXAM_COLUMN_MAP = {
  jee: 'min_jee',
  cat: 'min_cat',
  hsc: 'min_hsc',
  mhtcet: 'min_mhtcet'
};

// JEE is rank-based (lower is better) — student's rank must be <= cutoff rank
// All others are percentile-based (higher is better) — student's score must be >= cutoff
const RANK_BASED_EXAMS = ['jee'];

// GET all colleges
router.get('/colleges', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM colleges');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET search colleges
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;

    const [results] = await db.query(
      'SELECT * FROM colleges WHERE name LIKE ? OR city LIKE ? OR courses LIKE ?',
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET colleges filtered by eligibility (exam + marks), with optional extra filters
// Example: /api/filter?exam=jee&marks=85&course=B.Tech&state=Maharashtra
router.get('/filter', async (req, res) => {
  const { exam, marks, course, state, college_type } = req.query;

  const column = EXAM_COLUMN_MAP[exam];
  if (!column) {
    res.status(400).json({ error: 'Invalid or missing exam type. Use one of: jee, cat, hsc, mhtcet' });
    return;
  }

  const studentValue = parseFloat(marks);
  if (isNaN(studentValue)) {
    res.status(400).json({ error: 'Invalid or missing marks/rank value' });
    return;
  }

  const isRankBased = RANK_BASED_EXAMS.includes(exam);

  let sql = isRankBased
    ? `SELECT * FROM colleges WHERE ${column} IS NOT NULL AND ${column} >= ?`
    : `SELECT * FROM colleges WHERE ${column} IS NOT NULL AND ${column} <= ?`;

  const params = [studentValue];

  if (course) {
    sql += ' AND courses LIKE ?';
    params.push(`%${course}%`);
  }
  if (state) {
    sql += ' AND state = ?';
    params.push(state);
  }
  if (college_type) {
    sql += ' AND college_type = ?';
    params.push(college_type);
  }

  sql += isRankBased ? ` ORDER BY ${column} ASC` : ` ORDER BY ${column} DESC`;

  try {
    const [results] = await db.query(sql, params);

    const withChance = results.map(college => {
      const cutoff = college[column];
      let chance = 'moderate';

      if (isRankBased) {
        const margin = cutoff - studentValue;
        const relativeMargin = margin / cutoff;

        if (relativeMargin >= 0.30) chance = 'safe';
        else if (relativeMargin >= 0.05) chance = 'moderate';
        else chance = 'reach';

      } else {
        const margin = studentValue - cutoff;

        if (margin >= 5) chance = 'safe';
        else if (margin >= 1) chance = 'moderate';
        else chance = 'reach';
      }

      return {
        ...college,
        admission_chance: chance
      };
    });

    res.json(withChance);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET multiple colleges by IDs for comparison
// Example: /api/compare?ids=1,4,9
router.get('/compare', async (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) {
    res.status(400).json({ error: 'No ids provided' });
    return;
  }

  const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  if (ids.length === 0) {
    res.status(400).json({ error: 'No valid ids provided' });
    return;
  }

  const placeholders = ids.map(() => '?').join(',');
  try {
    const [results] = await db.query(
      `SELECT * FROM colleges WHERE id IN (${placeholders})`,
      ids
    );

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET single college by ID
router.get('/colleges/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [results] = await db.query('SELECT * FROM colleges WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json(results[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── Personalised Guidance ──────────────────────────────────────────
router.post('/guidance', async (req, res) => {
  const { name, phone, email, course, exam, marks, location, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const sql = `
    INSERT INTO guidance_requests (name, phone, email, course, exam, marks, location, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(
      sql,
      [name, phone, email || null, course || null, exam || null, marks || null, location || null, message || null]
    );

    res.json({ success: true, id: result.insertId });

  } catch (err) {
    console.error('Guidance insert error:', err);
    res.status(500).json({ error: 'Failed to save.' });
  }
});
// GET stats for homepage counters
router.get('/stats', async (req, res) => {
  try {
    const [[{ colleges }]] = await db.query('SELECT COUNT(*) AS colleges FROM colleges');
    const [[{ states }]] = await db.query('SELECT COUNT(DISTINCT state) AS states FROM colleges');
    const exams = Object.keys(EXAM_COLUMN_MAP).length; // 4 supported exams: jee, cat, hsc, mhtcet

    res.json({ colleges, states, exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;