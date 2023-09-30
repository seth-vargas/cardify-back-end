const express = require("express");
const morgan = require("morgan");

const { NotFoundError } = require("./expressError");

// TODO - require routes here
const cardRoutes = require("./routes/cards");
const deckRoutes = require("./routes/decks");
const userRoutes = require("./routes/users");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use("/cards", cardRoutes);
app.use("/decks", deckRoutes);
app.use("/users", userRoutes);

app.use((req, res, next) => {
  return next(new NotFoundError());
});

module.exports = app;
