const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/* Model for cards */

class Card {
  /* getAll - returns a list of all relevant cards */

  static async getAll(username, slug) {
    console.log(slug);
    const result = await client.query(
      `SELECT id, deck_slug AS "deckSlug", username, front, back, created_at AS "createdAt"
      FROM cards
      WHERE username = $1
      AND deck_slug = $2`,
      [username, slug]
    );
    return result.rows;
  }

  /* get(id) - retrieve card data from database.
    returns JSON card data.
    throws 404 if not found. */

  static async get(id) {
    const result = await client.query(
      `SELECT id, deck_slug AS "deckSlug", username, front, back, created_at AS "createdAt"
      FROM cards 
      WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /* create(data) - add new card to database.
    returns JSON of created card data.
    throws 404 if not found. */

  static async create({ deckId, deckSlug, username, front, back }) {
    console.log(deckSlug);
    const query = `
      INSERT INTO 
        cards (deck_slug, username, front, back)
        VALUES ($1, $2, $3, $4)
        RETURNING 
          id, 
          deck_slug AS "deckSlug",
          username, 
          front, 
          back, 
          created_at AS "createdAt"`;
    const result = await client.query(query, [deckSlug, username, front, back]);

    return result.rows[0];
  }

  /* update(id, data) - user can change front/back values.
    returns JSON of updated card.
    throws 404 if not found. */
  // TODO: The whole thing lol
  static async update(id, data) {}

  /* remove(id) - remove card from database.
    returns success/error message.
    throws 404 if not found. */

  static async remove(id) {
    const result = await client.query(
      `
    DELETE 
      FROM cards
      WHERE id = $1
      RETURNING id`,
      [id]
    );

    const card = result.rows[0];

    if (!card) throw new NotFoundError(`No card id: ${id}`);
  }
}

module.exports = Card;
