const { BadRequestError } = require("../expressError");

/** Convert partial JSON data into SQL query
 * 
 * This converts JSON data passed from the req.body into a SQL-friendly
 * formatted return.
 * 
 * First, it converts any non-matching keys into its corresponding SQL
 * column key.
 * 
 * Then it assigns a "$(int)" variable substitution for each key, to be
 * used as a variable substitution in the router.
 * 
 * Lastly, it returns an object that contains:
 * - setCols: the columns to be queried
 * - values: the values to update for each column
 * 
 * Arguments:
 * 1. dataToUpdate: JSON object of data to be queried
 * 2. jsToSql: JSON object that updates the inbound key with the matching
 * SQL column / key
 * 
 * Example: inbound data can be:
 * dataToUpdate = {"firstName": "testFName", "lastName": "testLName" }
 * 
 * Throws BadRequestError if no data is passed.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
