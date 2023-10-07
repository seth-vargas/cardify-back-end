/* routes for users */

const express = require("express");
const User = require("../models/user");
const { NotFoundError } = require("../expressError");

const userRouter = new express.Router();

/* Returns a list of users
  - optional filters: isPublic, isAdmin, username, firstName, lastName, orderBy 
  
  Authorization: Admin only
*/

userRouter.get("/", async function (req, res, next) {
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

userRouter.get("/:username", async function (req, res, next) {
  const { username } = req.params;

  try {
    const user = await User.getOr404(username);

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

userRouter.post("/", async function (req, res, next) {
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

userRouter.delete("/:id", async function (req, res, next) {
  const { id } = req.params;
  try {
    await User.remove(id);
    return res.json({ deleted: id });
  } catch (error) {
    return next(error);
  }
});

userRouter.get("/:username/following", async function (req, res, next) {
  const { username } = req.params;
  try {
    const following = await User.getFollowing(username);
    return res.json({ following });
  } catch (error) {
    return next(error);
  }
});
userRouter.get("/:username/followers", async function (req, res, next) {
  const { username } = req.params;
  try {
    const followers = await User.getFollowers(username);
    return res.json({ followers });
  } catch (error) {
    return next(error);
  }
});
userRouter.post("/:follower/follow/:followed", async function (req, res, next) {
  const { follower, followed } = req.params;
  try {
    const newFollow = await User.follow(follower, followed);
    return res.status(201).json({ newFollow });
  } catch (error) {
    return next(error);
  }
});
userRouter.delete(
  "/:follower/unfollow/:followed",
  async function (req, res, next) {
    const { follower, followed } = req.params;
    try {
      const message = await User.unfollow(follower, followed);
      return res.json({ message });
    } catch (error) {
      return next(error);
    }
  }
);

// module.exports = { userRouter, deckRouter };
module.exports = { userRouter };
