const bcrypt = require("bcrypt");

const client = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../expressError");

const Deck = require("./deck");
const Favorite = require("./favorite");
const Follow = require("./follow");

/* Model for users */

const common = `id, username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin", is_public AS "isPublic", created_at AS "createdAt"`;

class User {
  /* authenticate user with username, password. 
   - Returns { username, first_name, last_name, email, is_admin }
   - Throws UnauthorizedError is user not found or wrong password.
  */

  static async authenticate(username, password) {
    // try to find the user first
    const result = await client.query(
      `SELECT ${common}, password
      FROM users
      WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

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
    SELECT ${common}
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
      `SELECT ${common}
      FROM users 
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`User not found: ${username}`);

    user.decks = await Deck.getAll(username, {});
    user.followers = await Follow.getFollowers(user);
    user.following = await Follow.getFollowing(user);
    user.favorites = await Favorite.get(user);

    return user;
  }

  /* Register user with data.
    - Returns { username, firstName, lastName, email, isAdmin, isPublic }
    - Throws BadRequestError on duplicates.
  */

  static async signup({
    username,
    password,
    firstName,
    lastName,
    email,
    isAdmin = false,
    isPublic,
  }) {
    const duplicateCheck = await client.query(
      `SELECT id 
      FROM users 
      WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Sorry, that username is taken.`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await client.query(
      `INSERT INTO 
      users (username, password, first_name, last_name, email, is_admin, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${common}`,
      [username, hashedPassword, firstName, lastName, email, isAdmin, isPublic]
    );

    const user = result.rows[0];

    return user;
  }

  /* update(username, data) - user can change values.
    returns JSON of updated user.
    throws 404 if not found. */

  static async update(username, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      firstName: "num_employees",
      lastName: "logo_url",
      isAdmin: "is_admin",
      isPublic: "is_public",
    });

    const result = await client.query(
      `UPDATE users
      SET ${setCols} 
      WHERE username = ${username}
      RETURNING ${common}`,
      [...values]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

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
    - if either user cannot be found, throw 404 error.
    - Throw 500 error if:
      - User tries to follow themselves
      - Follower is already following followed user
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
      - if either user cannot be found, throw 404 error.
      - Throw 500 error if:
        - User tries to unfollow themselves
        - Follower is not following followed user
    */

  static async unfollow(follower, followed) {
    // check that both users exist
    const [followingUser, followedUser] = await Promise.all([
      User.getOr404(follower),
      User.getOr404(followed),
    ]);

    // check follower is not followed
    if (follower === followed)
      throw new BadRequestError("User cannot unfollow themselves. Loser.");

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

  /* Favorite another deck and return success/error message 
    - Throws 404 if user or deck is not found\
    - Throws 500 if deck is favorited
  */

  static async favorite(username, ownerUsername, slug) {
    const [user, owner] = await Promise.all([
      User.getOr404(username),
      User.getOr404(ownerUsername),
    ]);

    const deck = await Deck.getOr404(ownerUsername, slug);

    const favoritesResult = await client.query(
      `SELECT id FROM favorites WHERE user_id = $1 AND deck_id = $2`,
      [user.id, deck.id]
    );

    const favorites = favoritesResult.rows[0];

    if (favorites)
      throw new BadRequestError(
        `${user.username} has already favorited ${deck.title}`
      );

    const insertResult = await client.query(
      `INSERT INTO favorites (user_id, deck_id)
      VALUES ($1, $2)
      RETURNING id, user_id AS "userId", deck_id AS "deckId", created_at AS "createdAt"`,
      [user.id, deck.id]
    );

    const result = insertResult.rows[0];
    result.message = `${username} added ${deck.title} to their favorites.`;

    return result;
  }

  /* Unfavorite a deck and return success/error message
    - Throws 404 if user or deck is not found
    - Throws 500 if deck is not favorited by user
  */

  static async unfavorite(username, ownerUsername, slug) {
    const [user, owner] = await Promise.all([
      User.getOr404(username),
      User.getOr404(ownerUsername),
    ]);

    const deck = await Deck.getOr404(ownerUsername, slug);

    const favoritesResult = await client.query(
      `SELECT id FROM favorites WHERE user_id = $1 AND deck_id = $2`,
      [user.id, deck.id]
    );

    const favorites = favoritesResult.rows[0];

    if (!favorites)
      throw new BadRequestError(
        `${user.username} has not yet favorited ${deck.title}`
      );

    const deleteResult = await client.query(
      `DELETE FROM favorites
      WHERE id = $1
      RETURNING id`,
      [favorites.id]
    );

    return `${username} successfully removed ${deck.title} from their favorites list.`;
  }
}

module.exports = User;
