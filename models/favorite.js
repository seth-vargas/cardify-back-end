const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

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

  static async add(username, deckSlug) {
    const [user, deck] = await Promise.all([
      User.getOr404(username),
      Deck.getOr404(deckSlug),
    ]);

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

  static async create(username, deckSlug) {
    const [user, deck] = await Promise.all([
      User.getOr404(username),
      Deck.getOr404(deckSlug),
    ]);

    const favoritesResult = await client.query(
      `SELECT id FROM favorites WHERE user_id = $1 AND deck_id = $2`,
      [user.id, deck.id]
    );

    const favorites = favoritesResult.rows[0];

    if (!favorites)
      throw new BadRequestError(
        `${user.username} has not favorited deck ${deck.title}`
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

module.exports = Favorite;
