const { sqlForPartialUpdate } = require("./sql");

let dataToUpdate = {
  firstName: "NewF",
  lastName: "NewF",
  email: "new@email.com",
  isAdmin: true,
};

let jobDataToUpdate = {
  title: "new_j1",
  salary: 175000,
  equity: 0.011,
  company_handle: "c1",
};

let jsToSql = {
  firstName: "first_name",
  lastName: "last_name",
  isAdmin: "is_admin",
};

describe("sqlForPartialUpdate", function () {
  test("works: updates data", function () {
    let result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    let expectedResult = {
      setCols: '"first_name"=$1, "last_name"=$2, "email"=$3, "is_admin"=$4',
      values: ["NewF", "NewF", "new@email.com", true],
    };
    expect(result).toEqual(expectedResult);
  });
  test("works: updates when no jsToSql object is empty", function () {
    let result = sqlForPartialUpdate(jobDataToUpdate);
    let expectedResult = {
      setCols: '"title"=$1, "salary"=$2, "equity"=$3, "company_handle"=$4',
      values: ["new_j1", 175000, 0.011, "c1"],
    };
    expect(result).toEqual(expectedResult);
  });
  test("works: throws error if no data", function () {
    dataToUpdate = {};
    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrowError;
  });
  test("works: throws error if no data", function () {
    dataToUpdate = {};
    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrowError;
  });
});
