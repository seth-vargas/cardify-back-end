/* routes for cards */

const express = require("express");
const Card = require("../models/card");
const { NotFoundError } = require("../expressError");
const { deckRouter } = require("./decks");

const cardRouter = new express.Router({ mergeParams: true });
deckRouter.use("/:slug/cards", cardRouter);

/** GET /  =>
 *   { cards: [ { id, deck_id, username, front, back, created_at}, ...] }
 *
 * Can filter on provided search filters:
 * - username
 * - deckId
 *
 * Authorization required: none
 */

cardRouter.get("/", async function (req, res, next) {
  const { username, slug } = req.params;

  try {
    const cards = await Card.getAll(username, slug);
    return res.json({ cards });
  } catch (error) {
    return next(error);
  }
});

/** GET /:id  =>
 *    { card: {id, deck_id, username, front, back, created_at}}
 */

cardRouter.get("/:id", async function (req, res, next) {
  const id = req.params.id;

  try {
    const card = await Card.get(id);

    if (!card) throw new NotFoundError(`No card found: ${id}`);
    return res.json({ card });
  } catch (error) {
    return next(error);
  }
});

/** POST / =>
 *    {card: {id, deck_id, username, front, back, created_at}}
 */

cardRouter.post("/", async function (req, res, next) {
  const { username, slug } = req.params;
  try {
    req.body.deckSlug = slug;
    req.body.username = username;
    const card = await Card.create(req.body);
    return res.status(201).json({ card });
  } catch (error) {
    return next(error);
  }
});

// TODO: PATCH /:id

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

cardRouter.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  try {
    await Card.remove(id);
    return res.json({ deleted: id });
  } catch (error) {
    return next(error);
  }
});

module.exports = cardRouter;
