const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const cardRoutes = require("./routes/cards");
const { deckRouter } = require("./routes/decks");
const { userRouter } = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/cards", cardRoutes);
app.use("/users", userRouter);
app.use("/decks", deckRouter);

app.use((req, res, next) => {
  return next(new NotFoundError());
});

module.exports = app;
