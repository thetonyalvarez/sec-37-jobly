"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2TokenAdmin,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New Job",
    salary: 100000,
    equity: "0.002",
    company_handle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: 4,
        title: "New Job",
        salary: 100000,
        equity: "0.002",
        company_handle: "c1",
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 150000,
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        salary: "not-a-number",
        ...newJob,
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("invalid query validation", async function () {
    // username is not part of JobUpdate schema
    const resp = await request(app).get("/jobs?username=2");
    expect(() => resp).toThrowError;
  });

  test("error: salary is not a number", async function () {
    const resp = await request(app).get("/jobs?salary=asdf");
    expect(() => resp).toThrowError;
  });

  test("works: query for title param", async function () {
    const resp = await request(app).get("/jobs?title=2");
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 250000,
          equity: "0.002",
          company_handle: "c2",
        },
      ],
    });
  });

  test("works: title query is case-insensitive", async function () {
    const resp = await request(app).get("/jobs?title=J");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("404: name query doesn't exist", async function () {
    // job title cannot be found
    const resp = await request(app).get("/jobs?title=j999");
    expect(resp.statusCode).toEqual(404);
  });

  test("works: query for minSalary param", async function () {
    const resp = await request(app).get("/jobs?minSalary=200000");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("404: minSalary query not found", async function () {
    const resp = await request(app).get("/jobs?minSalary=900000");
    expect(resp.statusCode).toEqual(404);
  });

  test("works: title + minSalary search found", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=300000");
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j3",
          salary: 350000,
          equity: "0",
          company_handle: "c3",
        },
      ],
    });
  });

  test("works: hasEquity filter works", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("404: no results found for hasEquity = true", async function () {
    let updateData1 = {
      title: "j1",
      salary: 175000,
      equity: "0",
      company_handle: "c1",
    };
    let updateData2 = {
      title: "j2",
      salary: 175000,
      equity: "0",
      company_handle: "c2",
    };
    await Job.update(1, updateData1);
    await Job.update(2, updateData2);
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.statusCode).toEqual(404);
  });

  test("works: title + hasEquity filter works", async function () {
    const resp = await request(app).get("/jobs?title=2&hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 250000,
          equity: "0.002",
          company_handle: "c2",
        },
      ],
    });
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        title: "j1",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/999`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found for invalid id", async function () {
    const resp = await request(app).get(`/jobs/invalid`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "J1-new",
        salary: 150000,
        equity: "0.001",
        company_handle: "c1",
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/1`).send({
      title: "J1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/999`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found on invalid id", async function () {
    const resp = await request(app)
      .patch(`/jobs/invalid`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    console.log(resp.error);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        id: 555,
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unath for non-admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/9999`)
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found for invalid id", async function () {
    const resp = await request(app)
      .delete(`/jobs/nope`)
      .set("authorization", `Bearer ${u2TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});
