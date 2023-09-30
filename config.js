require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const PORT = process.env.PORT || 3000;

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
console.log("------------------------------------".america);
console.log("\n");

module.exports = {
  SECRET_KEY,
  PORT,
  getDatabaseUri,
};
