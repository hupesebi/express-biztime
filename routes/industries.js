const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

/* Get data for all industries */
// TODO: fix duplication
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.code, i.industry, c.code AS company
        FROM industries AS i
        LEFT JOIN companies_industries AS c_i
        ON i.code = c_i.industry_code
        LEFT JOIN companies AS c
        ON c.code = c_i.company_code`
    );
    return res.json({ industries: results.rows });
  } catch (err) {
    return next(err);
  }
});

/* Add an industry */
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const results = await db.query(
      `INSERT INTO industries (code, industry)
      VALUES ($1, $2) RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json(results.rows[0]);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;