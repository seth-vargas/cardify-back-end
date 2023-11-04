/* routes for decks */

const express = require("express");
const Deck = require("../models/deck");
const { NotFoundError } = require("../expressError");

const deckRouter = new express.Router();

/* Returns a list of decks
  - optional filters: username, isPublic, orderBy
  
  Authorization: Admin / logged in user
*/

deckRouter.get("/", async function (req, res, next) {
  const { username } = req.params;

  try {
    const decks = await Deck.getAll(username, req.query);
    return res.json({ decks });
  } catch (error) {
    return next(error);
  }
});

/* Returns JSON for a deck based on a username
  - if user not found, throws 404 error
  
  Authorization: Admin / logged in user only
*/

deckRouter.get("/:title", async function (req, res, next) {
  const { title } = req.params;
  const { username } = req.query;

  try {
    const deck = await Deck.getOr404(username, title);
    return res.json({ deck });
  } catch (error) {
    return next(error);
  }
});

/* Adds new deck to db and returns JSON with new deck data
  - If deck exists, throw 500 error
  
  Authorization: Admin / logged in user
*/

deckRouter.post("/", async function (req, res, next) {
  try {
    const deck = await Deck.create(req.body);
    return res.status(201).json({ deck });
  } catch (error) {
    return next(error);
  }
});

deckRouter.patch("/:deckId", async function (req, res, next) {
  const { deckId } = req.params;

  try {
    const dataToUpdate = req.body;
    const deck = await Deck.update(deckId, dataToUpdate);
    return res.json({ deck });
  } catch (error) {
    return next(error);
  }
});

/* Removes deck from db and returns JSON with id
  - If no deck, nothing happens
  
  Authorization: Admin, logged in user
*/

deckRouter.delete("/:deckId", async function (req, res, next) {
  const { deckId } = req.params;

  try {
    await Deck.remove(deckId);
    return res.json({ deleted: deckId });
  } catch (error) {
    return next(error);
  }
});

module.exports = { deckRouter };
