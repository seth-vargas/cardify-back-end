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

    const favRelationship = favoritesResult.rows;

    const favorites = [];

    for (let rel of favRelationship) {
      const deckResult = await client.query(
        `SELECT * FROM decks
        WHERE id = $1`,
        [rel.deckId]
      );
      favorites.push(deckResult.rows[0]);
    }

    return favorites;
  }
}

module.exports = Favorite;
