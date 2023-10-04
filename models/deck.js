const slug = require("slug");
const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/* Model for decks */

class Deck {
  /* Return list of all relevant decks => {decks: [{<deck>}, ...]}
    - Optional filters: username, isPublic, orderBy
  */

  static async getAll(username) {
    const result = await client.query(
      `SELECT id, title, slug, username, is_public AS "isPublic", created_at AS "createdAt"
      FROM decks
      WHERE username = $1`,
      [username]
    );

    return result.rows;
  }

  /* Return JSON of found deck => {deck: {<deck, cards: [<card>, ...]>}}
    - throws 404 if not found. 
  */

  static async get(username, title) {
    const result = await client.query(
      `SELECT id, title, slug, username, is_public AS "isPublic", created_at AS "createdAt"
      FROM decks
      WHERE username = $1
      AND slug = $2`,
      [username, title]
    );

    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`Deck not found: ${title}`);

    const cardResult = await client.query(
      `SELECT id, deck_id, username, front, back, created_at
      FROM cards
      WHERE deck_id = $1`,
      [deck.id]
    );

    deck.cards = cardResult.rows;

    return deck;
  }

  /* create(data) - add new deck to db and return JSON of new deck => {deck: {<deck>}} */

  static async create({ title, userId, isPublic }) {
    const query = `
      INSERT INTO 
        decks (title, slug, username, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, slug, username, is_public AS "isPublic", created_at AS "createdAt"`;
    const result = await client.query(query, [
      title,
      slug(title),
      userId,
      isPublic,
    ]);

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

  // TODO: Get AI generated questions for each card in a deck
  static async getAIGeneratedQuestions(deckId) {
    // get cards in this deck
    // send cards to AI along with prompt (perhaps use the deck title as a base to jump from for the prompt?)
    // get back 3 incorrect answers for the card
    // return => {cards: [{front (question), back (answer), incorrectAnswer1, incorrectAnswer2, incorrectAnswer3}, ...]}
  }
}

module.exports = Deck;
