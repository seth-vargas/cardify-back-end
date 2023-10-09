const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Deck = require("./deck");

class Favorite {
  static async get(user) {
    const favoritesResult = await client.query(
      `SELECT id, user_id AS "userId", deck_id AS "deckId", created_at AS "createdAt"
      FROM favorites
      WHERE user_id = $1`,
      [user.id]
    );

    return favoritesResult.rows;
  }
}

module.exports = Favorite;
