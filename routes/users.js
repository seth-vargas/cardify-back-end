/* routes for users */

const express = require("express");
const User = require("../models/user");
const { NotFoundError } = require("../expressError");
const router = new express.Router();

/* Returns a list of users
  - optional filters: isPublic, isAdmin, username, firstName, lastName, orderBy 
  
  Authorization: Admin only
*/

router.get("/", async function (req, res, next) {
  const query = req.query;

  try {
    const users = await User.getAll(query);
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

/* Returns JSON for a user based on a username
  - if user not found, throws 404 error
  
  Authorization: Admin / logged in user only
*/

router.get("/:username", async function (req, res, next) {
  const username = req.params.username;

  try {
    const user = await User.get(username);

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

/* Adds new user to db and returns JSON with new user data
  - If user exists, throw 500 error
  
  Authorization: Admin / logged in user
*/

router.post("/", async function (req, res, next) {
  try {
    const user = await User.create(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
});

// TODO: PATCH /:id

/* Removes user from db and returns JSON with id
  - If no user, nothing happens
  
  Authorization: Admin, logged in user
*/

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  try {
    await User.remove(id);
    return res.json({ deleted: id });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
