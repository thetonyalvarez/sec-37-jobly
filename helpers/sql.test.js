const { sqlForPartialUpdate } = require("./sql");

let dataToUpdate = {
    firstName: "NewF",
    lastName: "NewF",
    email: "new@email.com",
    isAdmin: true,
};

let jsToSql = {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin"
}

describe("sqlForPartialUpdate", function () {
    test("works: updates data", function () {
        let result = sqlForPartialUpdate(dataToUpdate, jsToSql)
        let expectedResult = {
            setCols: '"first_name"=$1, "last_name"=$2, "email"=$3, "is_admin"=$4',
            values: ["NewF", "NewF", "new@email.com", true]
        }
        expect(result).toEqual(expectedResult)
    });
    test("works: throws error if no data", function () {
        dataToUpdate = {};
        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrowError
    });
})