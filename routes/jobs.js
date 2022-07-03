"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

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

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  let q = req.query;

  // // convert query param string to integers
  if (q.salary !== undefined) {
    q.salary = Number(q.salary);
  }

  try {
    // ensure query is validated using jobSearch schema
    const validator = jsonschema.validate(req.query, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    // pass query variable 'q' to sql query function
    const jobs = await Job.findAll(q);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    // ensure query is validated using jobSearch schema
    const validator = jsonschema.validate(req.params, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, company_handle}
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Authorization required: admin login
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    // ensure query is validated using jobSearch schema
    const validator_id = jsonschema.validate(req.params, jobSearchSchema);
    if (!validator_id.valid) {
      const errs = validator_id.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator_id = jsonschema.validate(req.params, jobSearchSchema);
    if (!validator_id.valid) {
      const errs = validator_id.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
