const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/* Model for decks */

class Deck {
  /* Return list of all relevant decks => {decks: [{<deck>}, ...]}
    - Optional filters: username, isPublic, orderBy
  */

  static async getAll({ username = null, isPublic = null, orderBy = "id" }) {
    let query = `
      SELECT id, title, username, is_public AS "isPublic", created_at AS "createdAt"
      FROM decks`;

    let whereExpressions = [];
    let queryValues = [];

    if (username) {
      queryValues.push(`%${username}%`);
      whereExpressions.push(`username ILIKE $${queryValues.length}`);
    }

    if (isPublic) {
      queryValues.push(isPublic);
      whereExpressions.push(`is_public = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += ` ORDER BY ${orderBy}`;

    const result = await client.query(query, queryValues);
    return result.rows;
  }

  /* Return JSON of found deck => {deck: {<deck, cards: [<card>, ...]>}}
    - throws 404 if not found. 
  */

  static async get(id) {
    const result = await client.query(
      `SELECT id, title, username, is_public AS "isPublic", created_at AS "createdAt"
      FROM decks
      WHERE id = $1`,
      [id]
    );

    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`Deck not found: ${id}`);

    const cardResult = await client.query(
      `SELECT id, deck_id, username, front, back, created_at
      FROM cards
      WHERE deck_id = $1`,
      [id]
    );

    deck.cards = cardResult.rows;

    return deck;
  }

  /* create(data) - add new deck to db and return JSON of new deck => {deck: {<deck>}}
    throws 404 if not found. */

  static async create({ title, userId, isPublic }) {
    const query = `
      INSERT INTO 
        decks (title, username, is_public)
      VALUES ($1, $2, $3)
      RETURNING id, title, username, is_public AS "isPublic", created_at AS "createdAt"`;
    const result = await client.query(query, [title, userId, isPublic]);

    return result.rows[0];
  }

  /* update(id, data) - update deck info. 
    throws 404 if not found. */

  // TODO: The whole thing
  static async update(id, data) {}

  /* Removes deck from db and return succes / fail message => {<message>}
    throws 404 if not found. */

  static async remove(id) {
    const result = await client.query(
      `DELETE
        FROM decks
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`No deck: ${id}`);
  }
}

module.exports = Deck;
