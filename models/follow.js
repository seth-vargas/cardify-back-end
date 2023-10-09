const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

class Follow {
  /* Get a list of users who follow user. */

  static async getFollowers(user) {
    const followsResult = await client.query(
      `SELECT id, following_user_id AS "followingUserId", followed_user_id AS "followedUserId", created_at AS "createdAt"
          FROM follows
          WHERE followed_user_id = $1`,
      [user.id]
    );

    return followsResult.rows;
  }

  /* Get a list of users who the user follows. */

  static async getFollowing(user) {
    const followingResult = await client.query(
      `SELECT id, following_user_id AS "followingUserId", followed_user_id AS "followedUserId", created_at AS "createdAt"
            FROM follows
            WHERE following_user_id = $1`,
      [user.id]
    );

    return followingResult.rows;
  }
}

module.exports = Follow;
