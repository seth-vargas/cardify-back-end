const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/* Model for cards */

class Card {
  /* getAll - returns a list of all relevant cards */

  static async getAll({ deckId = null, username = null, orderBy = "id" }) {
    let query = `
    SELECT id, deck_id AS "deckId", username, front, back, created_at AS "createdAt"
    FROM cards`;

    let whereExpressions = [];
    let queryValues = [];

    if (deckId) {
      queryValues.push(deckId);
      whereExpressions.push(`deck_id = $${queryValues.length}`);
    }

    if (username) {
      queryValues.push(`%${username}%`);
      whereExpressions.push(`username ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += ` ORDER BY ${orderBy}`;

    const result = await client.query(query, queryValues);
    return result.rows;
  }

  /* get(id) - retrieve card data from database.
    returns JSON card data.
    throws 404 if not found. */

  static async get(id) {
    const result = await client.query(
      `SELECT id, deck_id AS "deckId", username, front, back, created_at AS "createdAt"
      FROM cards 
      WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /* create(data) - add new card to database.
    returns JSON of created card data.
    throws 404 if not found. */

  static async create({ deckId, username, front, back }) {
    const query = `
      INSERT INTO 
        cards (deck_id, username, front, back)
        VALUES ($1, $2, $3, $4)
        RETURNING 
          id,
          deck_id AS "deckId", 
          username, 
          front, 
          back, 
          created_at AS "createdAt"`;
    const result = await client.query(query, [deckId, username, front, back]);

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
