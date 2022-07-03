"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
// const jobUpdateSchema = require("../schemas/jobUpdate.json");
// const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle}
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    console.log("JOB", typeof req.body.equity);

    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

// /** GET /  =>
//  *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
//  *
//  * Can filter on provided search filters:
//  * - minEmployees
//  * - maxEmployees
//  * - nameLike (will find case-insensitive, partial matches)
//  *
//  * Authorization required: none
//  */

// router.get("/", async function (req, res, next) {
//   let q = req.query;

//   console.log("q", q);

//   // convert query param string to integers
//   if (q.minEmployees !== undefined) {
//     q.minEmployees = Number(q.minEmployees);
//   }
//   if (q.maxEmployees !== undefined) {
//     q.maxEmployees = Number(q.maxEmployees);
//   }

//   try {
//     // ensure query is validated using companySearch schema
//     const validator = jsonschema.validate(req.query, companySearchSchema);
//     if (!validator.valid) {
//       const errs = validator.errors.map((e) => e.stack);
//       throw new BadRequestError(errs);
//     }
//     // pass query variable 'q' to sql query function
//     const companies = await Company.findAll(q);
//     return res.json({ companies });
//   } catch (err) {
//     return next(err);
//   }
// });

// /** GET /[handle]  =>  { company }
//  *
//  *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
//  *   where jobs is [{ id, title, salary, equity }, ...]
//  *
//  * Authorization required: none
//  */

// router.get("/:handle", async function (req, res, next) {
//   try {
//     const company = await Company.get(req.params.handle);
//     return res.json({ company });
//   } catch (err) {
//     return next(err);
//   }
// });

// /** PATCH /[handle] { fld1, fld2, ... } => { company }
//  *
//  * Patches company data.
//  *
//  * fields can be: { name, description, numEmployees, logo_url }
//  *
//  * Returns { handle, name, description, numEmployees, logo_url }
//  *
//  * Authorization required: login
//  */

// router.patch("/:handle", ensureAdmin, async function (req, res, next) {
//   try {
//     const validator = jsonschema.validate(req.body, companyUpdateSchema);
//     if (!validator.valid) {
//       const errs = validator.errors.map((e) => e.stack);
//       throw new BadRequestError(errs);
//     }

//     const company = await Company.update(req.params.handle, req.body);
//     return res.json({ company });
//   } catch (err) {
//     return next(err);
//   }
// });

// /** DELETE /[handle]  =>  { deleted: handle }
//  *
//  * Authorization: login
//  */

// router.delete("/:handle", ensureAdmin, async function (req, res, next) {
//   try {
//     await Company.remove(req.params.handle);
//     return res.json({ deleted: req.params.handle });
//   } catch (err) {
//     return next(err);
//   }
// });

module.exports = router;
