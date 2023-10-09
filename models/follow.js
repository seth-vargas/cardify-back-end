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

  /* Follow another user and return success/error message
    - user cannot follow themselves.
    - if either user cannot be found, throw 404 error.
    */

  static async add(follower, followed) {
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
}

module.exports = Follow;
