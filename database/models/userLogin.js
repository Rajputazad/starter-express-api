const mongoose = require("mongoose");

const userlogin = mongoose.Schema({
  username: {
    type: String,
    require: [true, "User name required"],
  },
  password: {
    require: [true, "Password  required"],
    type: String,
  },
  email: {
    type: String,
    require: [true, "email required"],
    unique: [true, "that Email is taken. try another"],
  },
  contact: {
    type: String,
    require: [true, "contact required"],
    unique: [true, "that Contact is taken. try another"],


  },
  cars: [String],
  token: [],
  verify: {
    require: [true, "verify  required"],
    type: Boolean,
  },
});

module.exports = mongoose.model("userlogin", userlogin)
