
const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");
let router = new express.Router();

router.get('/', async (req, res, next) => {
    try{
        let result = await db.query('SELECT * FROM companies')
        return res.json({"companies": result.rows})

    }catch(e){
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try{
      const { code } = req.params;
      const results = await db.query(
        `SELECT c.code, c.name, c.description, i.industry 
        FROM companies AS c
        LEFT JOIN companies_industries AS c_i 
        ON c.code = c_i.company_code 
        LEFT JOIN industries AS i 
        ON c_i.industry_code = i.code 
        WHERE c.code=$1;`,
        [code]
      );
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't find company with code ${code}`, 404);
      }
      const invoice_results = await db.query(
        "SELECT * FROM invoices WHERE comp_code=$1",
        [code]
      );
      const { c_code, name, description } = results.rows[0];
      const invoices = invoice_results.rows;
      const industries = results.rows.map((r) => r.industry);
  
      return res.json({
        company: c_code,
        name,
        description,
        industries,
        invoices,
      });
    }catch(e){
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try{
        const {code, name, description} = req.body
        let result = await db.query( `INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`,[code, name, description]);
        return res.status(201).json({"company": result.rows[0]});

    }catch(e){
        return next(e);
    }
});

router.put("/:code", async function (req, res, next) {
    try {
      let {name, description} = req.body;
      let code = req.params.code;
  
      const result = await db.query(
            `UPDATE companies
             SET name=$1, description=$2
             WHERE code = $3
             RETURNING code, name, description`,
          [name, description, code]);
  
      if (result.rows.length === 0) {
        throw new ExpressError(`No such company: ${code}`, 404)
      } else {
        return res.json({"company": result.rows[0]});
      }
    }
  
    catch (err) {
      return next(err);
    }
  
  });

  router.put("/:code/industry", async (req, res, next) => {
    try {
      const results = await db.query(
        `INSERT INTO companies_industries (company_code, industry_code)
          VALUES ($1, $2) RETURNING company_code, industry_code`,
        [req.params.code, req.body.industry_code]
      );
      return res.json(results.rows[0]);
    } catch (err) {
      return next(err);
    }
  });
  

  router.delete("/:code", async function (req, res, next) {
    try {
   
      let code = req.params.code;
  
      const result = await db.query(
            `DELETE FROM companies
            WHERE code=$1
            RETURNING code`,
         [code]);
  
      if (result.rows.length === 0) {
        throw new ExpressError(`No such company: ${code}`, 404)
      } else {
        return res.json({"status": "deleted"});
      }
    }
  
    catch (err) {
      return next(err);
    }
  
  });




module.exports = router;