"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 100000,
    equity: "0.002",
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job.title).toEqual(newJob.title);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
          FROM jobs
          WHERE id = '4'`
    );
    expect(result.rows).toEqual([
      {
        title: "New Job",
        salary: 100000,
        equity: "0.002",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let q = {};
    let jobs = await Job.findAll(q);
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 350000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });
  test("works: query for title params", async function () {
    let q = { title: "j1" };
    let jobs = await Job.findAll(q);
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
    ]);
  });
  test("works: query for minSalary param", async function () {
    let q1 = { minSalary: 300000 };
    let q2 = { minSalary: 200000 };
    let jobQuery1 = await Job.findAll(q1);
    let jobQuery2 = await Job.findAll(q2);
    expect(jobQuery1).toEqual([
      {
        title: "j3",
        salary: 350000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
    expect(jobQuery2).toEqual([
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 350000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });
  test("works: query for hasEquity param", async function () {
    let q1 = { hasEquity: true };
    let jobQuery1 = await Job.findAll(q1);
    expect(jobQuery1).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
    ]);
  });
  test("works: query for company_handle", async function () {
    let q = { company_handle: "c" };
    let q1 = { company_handle: "c1" };
    let q2 = { company_handle: "c2" };
    let jobQuery = await Job.findAll(q);
    let jobQuery1 = await Job.findAll(q1);
    let jobQuery2 = await Job.findAll(q2);
    expect(jobQuery).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 350000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
    expect(jobQuery1).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
    ]);
    expect(jobQuery2).toEqual([
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
    ]);
  });
  test("404: minSalary query not found", async function () {
    let q = { minSalary: 9999999 };
    try {
      await Job.findAll(q);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("works: title + minSalary search found", async function () {
    let q = { title: "j", minSalary: 200000 };
    let jobs = await Job.findAll(q);
    expect(jobs).toEqual([
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 350000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });
  test("works: title + hasEquity search found", async function () {
    let q = { title: "j", hasEquity: true };
    let jobs = await Job.findAll(q);
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
    ]);
  });
  test("works: company_handle + minSalary search found", async function () {
    let q = { company_handle: "c", minSalary: 200000 };
    let jobs = await Job.findAll(q);
    expect(jobs).toEqual([
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 350000,
        equity: "0",
        company_handle: "c3",
      },
    ]);
  });
  test("works: company_handle + hasEquity search found", async function () {
    let q = { company_handle: "c", hasEquity: true };
    let jobs = await Job.findAll(q);
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
      {
        title: "j2",
        salary: 250000,
        equity: "0.002",
        company_handle: "c2",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works: get job by id", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      title: "j1",
      salary: 150000,
      equity: "0.001",
      company_handle: "c1",
    });
  });
  test("404: job id not found", async function () {
    try {
      await Job.get(999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "j1",
    salary: 175000,
    equity: "0.011",
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      ...updateData,
    });

    const result = await db.query(`
      SELECT title,
              salary,
              equity,
              company_handle
      FROM jobs
      WHERE id = 1
    `);
    expect(result.rows).toEqual([
      {
        title: "j1",
        salary: 175000,
        equity: "0.011",
        company_handle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "j1",
      salary: null,
      equity: null,
      company_handle: "c1",
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      ...updateDataSetNulls,
    });

    const result = await db.query(`
      SELECT title,
              salary,
              equity,
              company_handle
      FROM jobs
      WHERE id = 1
    `);
    expect(result.rows).toEqual([
      {
        title: "j1",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(9999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with null id", async function () {
    try {
      await Job.update(null, updateData);
      fail();
    } catch (err) {
      console.log(err);
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with undefined id", async function () {
    try {
      await Job.update(undefined, updateData);
      fail();
    } catch (err) {
      console.log(err);
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query("SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
