const mongoose = require("mongoose");

const mailSchema = new mongoose.Schema({
  tgId: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: String,
    default: "system"
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Mail", mailSchema);
