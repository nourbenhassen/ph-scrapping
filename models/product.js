const mongoose = require("mongoose");

let productSchema = new mongoose.Schema({
  name: String,
  description: String,
  upvote: Number,
  date: Date
});

let Product = mongoose.model("Product", productSchema);

module.exports = Product;
