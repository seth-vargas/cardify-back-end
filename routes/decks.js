/* routes for decks */

const express = require("express");
const Deck = require("../models/deck");
const { NotFoundError } = require("../expressError");
// const router = new express.Router();
const { deckRouter } = require("./users");

/* Returns a list of decks
  - optional filters: username, isPublic, orderBy
  
  Authorization: Admin / logged in user
*/

deckRouter.get("/", async function (req, res, next) {
  const { username } = req.params;

  try {
    const decks = await Deck.getAll(username);
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
  const { username, title } = req.params;

  try {
    const deck = await Deck.get(username, title);

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

deckRouter.post("/", async function (req, res, next) {
  const username = req.params.username;

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

deckRouter.delete("/:title", async function (req, res, next) {
  const title = req.params.title;
  const username = req.params.username;

  try {
    await Deck.remove(title);
    return res.json({ deleted: title });
  } catch (error) {
    return next(error);
  }
});

module.exports = deckRouter;
