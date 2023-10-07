const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Deck = require("./deck");

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
    SELECT id, username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin", is_public AS "isPublic", created_at AS "createdAt"
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

  static async getOr404(username) {
    const result = await client.query(
      `SELECT id, username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin", is_public AS "isPublic", created_at AS "createdAt"
      FROM users 
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`User not found: ${username}`);

    user.decks = await Deck.getAll(username, {});
    user.followers = await User.getFollowers(username);
    user.following = await User.getFollowing(username);

    return user;
  }

  /* Add a new user to db and return JSON of created user data => {user: {<user>}}
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
    const user = await client.query(
      `SELECT id 
      FROM users 
      WHERE username = $1`,
      [username]
    );

    if (user.rows[0]) {
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
      `DELETE 
      FROM users
      WHERE username = $1
      RETURNING username`,
      [username]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user username: ${username}`);
  }

  /* Follow another user and return success/error message
    - user cannot follow themselves.
    - if either user cannot be found, throw 404 error.
  */

  static async follow(follower, followed) {
    // check follower is not followed
    if (follower === followed)
      throw new BadRequestError("User cannot follow themselves. Loser.");

    // check if both users exist
    const [followingUser, followedUser] = await Promise.all([
      User.getOr404(follower),
      User.getOr404(followed),
    ]);

    // check if followed user and following user already have a relationship
    const followsResult = await client.query(
      `SELECT id FROM follows WHERE followed_user_id = $1 AND following_user_id = $2`,
      [followedUser.id, followingUser.id]
    );

    const follows = followsResult.rows[0];

    if (follows)
      throw new BadRequestError(
        `${followingUser.username} is already following ${followedUser.username}.`
      );

    // create a relationship => {message: "<FOLLOWING_USERNAME> subscribed to <FOLLOWED_USERNAME>'s feed."}
    const insertResult = await client.query(
      `INSERT INTO follows (following_user_id, followed_user_id)
      VALUES ($1, $2)
      RETURNING id, following_user_id AS "followingUserId", followed_user_id AS "followedUserId", created_at AS "createdAt"`,
      [followingUser.id, followedUser.id]
    );

    const result = insertResult.rows[0];
    result.message = `${follower} subscribed to ${followed}'s feed.`;
    return result;
  }

  /* Unfollow another user and return success/error message.
    - User cannot unfollow someone who they do not follow.
    - if either user cannot be found, throw 404 error.
  */

  static async unfollow(follower, followed) {
    // check that both users exist
    const [followingUser, followedUser] = await Promise.all([
      User.getOr404(follower),
      User.getOr404(followed),
    ]);

    // check if followed user and following user already have a relationship
    const followsResult = await client.query(
      `SELECT id FROM follows WHERE followed_user_id = $1 AND following_user_id = $2`,
      [followedUser.id, followingUser.id]
    );

    const follows = followsResult.rows[0];

    if (!follows)
      throw new BadRequestError(
        `${followingUser.username} is not following ${followedUser.username}`
      );

    const deleteResult = await client.query(
      `DELETE
      FROM follows
      WHERE id = $1
      RETURNING id`,
      [follows.id]
    );

    return `${follower} successfully unfollowed ${followed}.`;
  }

  /* Get a list of users who follow user.
    - throws 404 error if user not in db
  */

  static async getFollowers(username) {
    // check if user exists
    const userResult = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    if (!user) throw new NotFoundError(`User not found: ${username}`);

    const followsResult = await client.query(
      `SELECT id, following_user_id AS "followingUserId", followed_user_id AS "followedUserId", created_at AS "createdAt"
      FROM follows
      WHERE followed_user_id = $1`,
      [user.id]
    );

    return followsResult.rows;
  }

  /* Get a list of users who the user follows
    - throws 404 error if user not in db
  */

  static async getFollowing(username) {
    // check if user exists
    const userResult = await client.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    if (!user) throw new NotFoundError(`User not found: ${username}`);

    const followingResult = await client.query(
      `SELECT id, following_user_id AS "followingUserId", followed_user_id AS "followedUserId", created_at AS "createdAt"
      FROM follows
      WHERE following_user_id = $1`,
      [user.id]
    );

    return followingResult.rows;
  }

  // TODO: Favorite a deck / Un-favorite a deck
  static async toggleFavoriteDeck(deckId, username) {
    // check if this deck is already favorited
    // if it is, remove from favorites => {message: "removed <DECK_TITLE> from <USERNAME>'s favorites"}
    // if it is not, add to favorites => {message: "added <DECK_TITLE> to <USERNAME>'s favorites"}
  }

  // TODO: Pin a deck / Un-pin a deck
  static async togglePinnedDeck(deckId, username) {
    // check if this deck is already pinned
    // if it is, remove from pins => {message: "<USERNAME> removed <DECK_TITLE> from their pinned list."}
    // if it is not, add to pins => {message: "<USERNAME> added <DECK_TITLE> to their pinned list."}
  }
}

module.exports = User;
