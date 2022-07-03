"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Queries all companies.
   *
   * If query exists, it is first validated by companySearch schema.
   * If query is validated, then it returns results based on query filters.
   *
   * Query can include any or all of the following:
   * - name [string]: search for partial or full matches of company name
   * - minEmployees [int]: search for companies that have at least this many employees
   * - maxEmployees [int]: search for companies that have at most this many employees
   *
   * If no query, then return all companies in database.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(query) {
    let { name, minEmployees, maxEmployees } = query;

    let searchCols = [];
    let searchValues = [];

    if (minEmployees > maxEmployees) {
      throw new BadRequestError(`Min. employees cannot exceed max employees.`);
    }

    if (name !== undefined) {
      searchValues.push(`%${name}%`);
      searchCols.push(`name ILIKE $${searchValues.length}`);
    }

    if (minEmployees !== undefined) {
      searchValues.push(minEmployees);
      searchCols.push(`num_employees >= $${searchValues.length}`);
    }

    if (maxEmployees !== undefined) {
      searchValues.push(maxEmployees);
      searchCols.push(`num_employees <= $${searchValues.length}`);
    }

    if (searchValues.length > 0) {
      console.debug("searchValues");
      let resultFiltered = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
        FROM companies
        WHERE ${searchCols.join(" AND ")}
        ORDER BY name`,
        searchValues
      );

      if (resultFiltered.rows.length == 0) {
        throw new NotFoundError("Company name not found.");
      }

      return resultFiltered.rows;
    }

    let resultAll = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
      FROM companies
      ORDER BY name`
    );

    return resultAll.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `
      SELECT c.handle,
            c.name,
            c.description,
            c.num_employees AS "numEmployees",
            c.logo_url AS "logoUrl",
            j.id as "jobId", 
            j.title, 
            j.salary, 
            j.equity,
            j.company_handle AS "companyHandle"
      FROM companies c
      LEFT JOIN jobs j
      ON c.handle = j.company_handle
      WHERE c.handle = $1
    `,
      [handle]
    );

    let jobsMap;

    if (!companyRes.rows[0]) throw new NotFoundError(`No company: ${handle}`);

    if (!companyRes.rows[0].jobId) {
      jobsMap = [];
    } else {
      // Map jobs
      jobsMap = companyRes.rows.map((j) => ({
        id: j.jobId,
        title: j.title,
        salary: j.salary,
        equity: j.equity,
      }));
    }

    return {
      handle: companyRes.rows[0].handle,
      name: companyRes.rows[0].name,
      description: companyRes.rows[0].description,
      numEmployees: companyRes.rows[0].numEmployees,
      logoUrl: companyRes.rows[0].logoUrl,
      jobs: jobsMap,
    };
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
