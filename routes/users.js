const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { User, validate, validateCards } = require("../models/user");
const { Card } = require("../models/card");
const auth = require("../middleware/auth");
const router = express.Router();

const getCards = async (cardsArray) => {
  const cards = await Card.find({ bizNumber: { $in: cardsArray } });
  return cards;
};

const getFavoriteCards = async (user) => {
  return user;
};

router.get("/cards", auth, async (req, res) => {
  if (!req.query.numbers) res.status(400).send("Missing numbers data");

  let data = {};
  data.cards = req.query.numbers.split(",");

  const cards = await getCards(data.cards);
  res.send(cards);
});

router.patch("/cards", auth, async (req, res) => {
  const cards = await getCards(req.body.cards);
  if (cards.length != req.body.cards.length)
    res.status(400).send("Card numbers don't match");

  let user = await User.findById(req.user._id);

  user.favoriteCards = req.body.cards;
  user = await user.save();
  res.send(user);
});

router.put("/favorite-cards", auth, async (req, res) => {
  let user = await User.findById(req.user._id);
  user.favoriteCards.push(req.body.cardId);
  user = await user.save();
  res.send(user);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const cards = await Card.find({ user_id: req.user._id });
  user.cards = cards;
  res.send(user);
});

router.get("/mecards", auth, async (req, res) => {
  const cards = await Card.find({ user_id: req.user._id });
  res.send(cards);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);

  if (error) return res.status(400).send({ message: error.details[0].message });

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(400).send({ message: "User already registered." });

  user = new User(
    _.pick(req.body, ["name", "email", "password", "biz", "cards"])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const response = Object.assign(
    { password: req.body.password },
    _.pick(user, ["_id", "email"])
  );
  res.send(response);
});

module.exports = router;
