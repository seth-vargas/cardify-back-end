const { BadRequestError } = require("../expressError");

/* 
  Updates database without needing to change the entire resource.
  
  parameters:
  * dataToUpdate: Object --> {resourceProperty: "updated value"}
  * jsToSql: Object --> {camelCase: "camel_case"}

  Returns an object -> {setCols, values}:
  * setCols: '"property"=$numIndex", ...'
  * values: [values, ...]
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
