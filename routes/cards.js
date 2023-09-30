/* routes for cards */

const express = require("express");
const Card = require("../models/card");
const { NotFoundError } = require("../expressError");
const router = new express.Router();

/** GET /  =>
 *   { cards: [ { id, deck_id, username, front, back, created_at}, ...] }
 *
 * Can filter on provided search filters:
 * - username
 * - deckId
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const query = req.query;

  if (query.deckId !== undefined) query.deckId = +query.deckId;

  try {
    const cards = await Card.getAll(query);
    return res.json({ cards });
  } catch (error) {
    return next(error);
  }
});

/** GET /:id  =>
 *    { card: {id, deck_id, username, front, back, created_at}}
 */

router.get("/:id", async function (req, res, next) {
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

router.post("/", async function (req, res, next) {
  try {
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

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  try {
    await Card.remove(id);
    return res.json({ deleted: id });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
