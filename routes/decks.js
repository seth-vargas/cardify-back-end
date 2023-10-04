/* routes for decks */

const express = require("express");
const Deck = require("../models/deck");
const { NotFoundError } = require("../expressError");
const router = new express.Router();

/* Returns a list of decks
  - optional filters: username, isPublic, orderBy
  
  Authorization: Admin / logged in user
*/

router.get("/", async function (req, res, next) {
  const query = req.query;

  try {
    const decks = await Deck.getAll(query);
    return res.json({ decks });
  } catch (error) {
    return next(error);
  }
});

/* Returns JSON for a deck based on a username
  - if user not found, throws 404 error
  
  Authorization: Admin / logged in user only
*/

router.get("/:title", async function (req, res, next) {
  const title = req.params.title;

  try {
    const deck = await Deck.get(title);

    // if (!deck) throw new NotFoundError(`No deck: ${title}`);

    return res.json({ deck });
  } catch (error) {
    return next(error);
  }
});

/* Adds new deck to db and returns JSON with new deck data
  - If deck exists, throw 500 error
  
  Authorization: Admin / logged in user
*/

router.post("/", async function (req, res, next) {
  try {
    const deck = await Deck.create(req.body);
    return res.status(201).json({ deck });
  } catch (error) {
    return next(error);
  }
});

// TODO: PATCH /:id

/* Removes deck from db and returns JSON with id
  - If no deck, nothing happens
  
  Authorization: Admin, logged in user
*/

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  try {
    await Deck.remove(id);
    return res.json({ deleted: id });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
