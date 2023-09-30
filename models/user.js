const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/* Model for users */

class User {
  /* Returns a list of all relevant users => {users: [{<user>}, ...]}
    - Optionally filter by publicity, admin access, usernames, first and last names.
    - Optionally alter orderBy.
  */

  static async getAll({
    isPublic = null,
    isAdmin = null,
    username = null,
    firstName = null,
    lastName = null,
    orderBy = "id",
  }) {
    let query = `
    SELECT username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin", is_public AS "isPublic", created_at AS "createdAt"
    FROM users`;

    let whereExpressions = [];
    let queryValues = [];

    if (isPublic) {
      queryValues.push(isPublic);
      whereExpressions.push(`is_public = $${queryValues.length}`);
    }

    if (isAdmin) {
      queryValues.push(isAdmin);
      whereExpressions.push(`is_admin = $${queryValues.length}`);
    }

    if (username) {
      queryValues.push(`%${username}%`);
      whereExpressions.push(`username ILIKE $${queryValues.length}`);
    }

    if (firstName) {
      queryValues.push(`%${firstName}%`);
      whereExpressions.push(`first_name ILIKE $${queryValues.length}`);
    }

    if (lastName) {
      queryValues.push(`%${lastName}%`);
      whereExpressions.push(`last_name ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += ` ORDER BY ${orderBy}`;

    const result = await client.query(query, queryValues);
    return result.rows;
  }

  /* Retrieve user data from db, returns JSON user data => {user: {<user, decks: [{<deck>}, ...]}>}
    - throws 404 if not found. 
  */

  static async get(username) {
    const result = await client.query(
      `SELECT username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin", is_public AS "isPublic", created_at AS "createdAt"
      FROM users 
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`User not found: ${username}`);

    const deckResult = await client.query(
      `SELECT title, is_public AS "isPublic", created_at AS "createdAt"
      FROM decks
      WHERE username = $1`,
      [username]
    );

    user.decks = deckResult.rows;

    return user;
  }

  /* Add a new user to db and return JSON of created user data => {user: {<user>}}
    - throws 404 error if not found. 
    - If user exists then throw bad request error.
  */

  static async create({
    username,
    password,
    firstName,
    lastName,
    email,
    isAdmin,
    isPublic,
  }) {
    if (User.get(username)) {
      throw new BadRequestError(`Username ${username} exists.`);
    }

    const query = `
      INSERT INTO 
        users (username, password, first_name, last_name, email, is_admin, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin", is_public AS "isPublic", created_at AS "createdAt"`;
    const result = await client.query(query, [
      username,
      password,
      firstName,
      lastName,
      email,
      isAdmin,
      isPublic,
    ]);

    return result.rows[0];
  }

  /* update(username, data) - user can change values.
    returns JSON of updated user.
    throws 404 if not found. */
  // TODO: The whole thing
  static async update(username, data) {}

  /* Remove a user from database and return success/error message => {<message>}
    - throws 404 if not found. 
    - If user not found throw 404 error  
  */

  static async remove(username) {
    const result = await client.query(
      `
    DELETE 
      FROM users
      WHERE username = $1
      RETURNING username`,
      [username]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user username: ${username}`);
  }
}

module.exports = User;
