require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const PORT = +process.env.PORT || 3000;

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? "cardify_test"
    : process.env.DATABASE_URL || "cardify";
}

console.log("\n");
console.log("------------------------------------".america);
console.log("Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR:".yellow, BCRYPT_WORK_FACTOR.toString());
console.log("Database:".yellow, getDatabaseUri());
console.log("------------------------------------".america);
console.log("\n");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
