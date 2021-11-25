const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { User, validate } = require("../models/user");
const { Card } = require("../models/card");
const auth = require("../middleware/auth");
const router = express.Router();

//Taking array of BizNumbers and sending back the cards
const getCards = async (cardsArray) => {
  const cards = await Card.find({ bizNumber: { $in: cardsArray } });
  return cards;
};

//Returning the user FavoriteCards
router.get("/favorite-cards", auth, async (req, res) => {
  if (!req.query.bizNum) res.status(400).send("Missing bizNum data");
  let data = {};
  data.favoriteCards = req.query.bizNum.split(",");
  const cards = await getCards(data.favoriteCards);
  res.send(cards);
});

//Add New Favorite Card
router.put("/favorite-cards", auth, async (req, res) => {
  let user = await User.findById(req.user._id);
  user.favoriteCards.push(req.body.cardBizNumber);
  user = await user.save();
  res.send(user);
});

router.put("/favorite-cards-delete", auth, async (req, res) => {
  console.log(req.body);
  let user = await User.findById(req.user._id);
  let updatedFavoriteCards = user.favoriteCards.filter(
    (favoriteCard) => favoriteCard != req.body.cardBizNumber
  );
  user.favoriteCards = updatedFavoriteCards;
  user = await user.save();
  res.send(user);
});

//Sending The User Data
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  const cards = await Card.find({ user_id: req.user._id });
  user.cards = cards;
  res.send(user);
});

//Create A New User
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
