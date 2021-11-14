const mongoose = require("mongoose");

mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);
mongoose
  .connect("mongodb://localhost/business-cards-app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB..."));

module.exports = mongoose;
