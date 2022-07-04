"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title [text], salary [int], equity [numeric], company_handle [varchar(25)] }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs
              (title, salary, equity, company_handle)
              VALUES ($1, $2, $3, $4)
              RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];
    console.log(job);

    return job;
  }

  /** Queries all jobs.
   *
   * If query exists, it is first validated by jobSearch schema.
   * TODO: add jobSearch schema.
   * If query is validated, then it returns results based on query filters.
   *
   * Query can include any or all of the following:
   * - title [string]: search for partial or full matches of title
   * - minSalary [int]: search for jobs that have at least this salary
   * - maxSalary [int]: search for jobs that have at most this salary
   * - minEquity [numeric]: search for jobs that have at least this equity
   * - maxEquity [numeric]: search for jobs that have at most this equity
   * - company_handle [varchar(25)]: search for partial or full matches of company
   *
   * If no query, then return all jobs in database.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

  static async findAll(query) {
    let { title, minSalary, maxSalary, minEquity, maxEquity, company_handle } =
      query;

    let searchCols = [];
    let searchValues = [];

    if (minSalary > maxSalary || minEquity > maxEquity) {
      throw new BadRequestError(`Minimum cannot exceed maximum.`);
    }

    if (title !== undefined) {
      searchValues.push(`%${title}%`);
      searchCols.push(`title ILIKE $${searchValues.length}`);
    }

    if (minSalary !== undefined) {
      searchValues.push(minSalary);
      searchCols.push(`salary >= $${searchValues.length}`);
    }

    if (maxSalary !== undefined) {
      searchValues.push(maxSalary);
      searchCols.push(`salary <= $${searchValues.length}`);
    }

    if (minEquity !== undefined) {
      searchValues.push(minEquity);
      searchCols.push(`equity >= $${searchValues.length}`);
    }

    if (maxEquity !== undefined) {
      searchValues.push(maxEquity);
      searchCols.push(`equity <= $${searchValues.length}`);
    }

    if (company_handle !== undefined) {
      searchValues.push(`%${company_handle}%`);
      searchCols.push(`company_handle ILIKE $${searchValues.length}`);
    }

    if (searchValues.length > 0) {
      let resultFiltered = await db.query(
        `SELECT title, 
                salary,
                equity,
                company_handle
        FROM jobs
        WHERE ${searchCols.join(" AND ")}
        ORDER BY title`,
        searchValues
      );
      console.debug("results", resultFiltered);

      if (resultFiltered.rows.length == 0) {
        throw new NotFoundError("Job not found.");
      }

      return resultFiltered.rows;
    }

    let resultAll = await db.query(
      `SELECT title, 
                salary,
                equity,
                company_handle
        FROM jobs
        ORDER BY title`
    );

    return resultAll.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const result = await db.query(
      `SELECT title, 
              salary,
              equity,
              company_handle
      FROM jobs
      WHERE id = $1`,
      [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found for id ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * Must have job id.
   * Throws BadRequestError if id == undefined or null.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, company_handle}
   *
   * Returns {title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    if (!id) throw new BadRequestError(`Job id must be passed.`);

    const { setCols, values } = sqlForPartialUpdate(data, {});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Must pass job id.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `
      DELETE
      FROM jobs
      WHERE id = $1
      RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
