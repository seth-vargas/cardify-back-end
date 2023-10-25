const slug = require("slug");
const client = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { isPromise } = require("util/types");

/* Model for decks */

const commonQuery = `id, title, description, slug, username, is_public AS "isPublic", created_at AS "createdAt"`;

class Deck {
  /* Return list of all relevant decks => {decks: [{<deck>}, ...]} */

  static async getAll(
    username = null,
    { term = null, isPublic = null, orderBy = null }
  ) {
    let query = `SELECT ${commonQuery} FROM decks`;

    let queryValues = [];
    let whereExpressions = [];

    if (isPublic) {
      queryValues.push(isPublic);
      whereExpressions.push(`is_public = $${queryValues.length}`);
    }

    if (username) {
      queryValues.push(username);
      whereExpressions.push(`username = $${queryValues.length}`);
    }

    if (term) {
      queryValues.push(`%${term}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    const deckResult = await client.query(query, queryValues);

    const decks = deckResult.rows;

    for (const deck of decks) {
      const cardResult = await client.query(
        `SELECT id, username, front, back, created_at
        FROM cards
        WHERE deck_slug = $1`,
        [deck.slug]
      );

      deck.cards = cardResult.rows;
      deck.tags = await Deck.getTagList(deck.id);
    }

    return decks;
  }

  /* Return JSON of found deck => {deck: {<deck, cards: [<card>, ...]>}}
    - throws 404 if not found. 
  */

  static async getOr404(username, slug) {
    const result = await client.query(
      `SELECT ${commonQuery}
      FROM decks
      WHERE username = $1
      AND slug = $2`,
      [username, slug]
    );

    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`Deck not found: ${slug}`);

    const cardResult = await client.query(
      `SELECT id, username, front, back, created_at
      FROM cards
      WHERE deck_slug = $1`,
      [slug]
    );

    deck.cards = cardResult.rows;
    deck.tags = await Deck.getTagList(deck.id);

    return deck;
  }

  /* create(data) - add new deck to db and return JSON of new deck => {deck: {<deck>}} */

  static async create({ username, title, description, isPublic }) {
    const query = `
      INSERT INTO 
        decks (title, description, slug, username, is_public)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${commonQuery}`;
    const result = await client.query(query, [
      title,
      description,
      slug(title),
      username,
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

  static async remove(deckId) {
    const result = await client.query(
      `DELETE
        FROM decks
        WHERE id = $1
        RETURNING id`,
      [deckId]
    );
    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`No deck: ${deckId}`);
  }

  // TODO: Get AI generated questions for each card in a deck
  static async getAIGeneratedQuestions(deckId) {
    // get cards in this deck
    // send cards to AI along with prompt (perhaps use the deck title as a base to jump from for the prompt?)
    // get back 3 incorrect answers for the card
    // return => {cards: [{front (question), back (answer), incorrectAnswer1, incorrectAnswer2, incorrectAnswer3}, ...]}
  }

  static async getTagList(id) {
    const deckTagResponse = await client.query(
      `SELECT * FROM decks_tags WHERE deck_id = $1`,
      [id]
    );
    const deckTags = deckTagResponse.rows;

    let tags = [];
    for (const deckTag of deckTags) {
      const tagNameResp = await client.query(
        `SELECT * FROM tags WHERE id = $1`,
        [deckTag.tag_id]
      );
      tags.push(tagNameResp.rows[0].tag_name);
    }
    return tags;
  }

  // TODO: static async addTag(deck, tag) {}

  // TODO: static async removeTag(deck, tag) {}
}

module.exports = Deck;
