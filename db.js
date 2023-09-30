const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

const connectionString = `postgres:///${getDatabaseUri()}`;

const client = new Client({ connectionString });

client.connect();

module.exports = client;
