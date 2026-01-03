// db/models/CodeBattle.js
const mongoose = require("mongoose");

const CodeBattleSchema = new mongoose.Schema({
  battleId: String,
  challengerId: String,
  opponentId: String,
  status: { type: String, default: "pending" },
  scores: {
    challenger: { type: Number, default: 0 },
    opponent: { type: Number, default: 0 }
  },
  questionIndex: { type: Number, default: 0 },
  chatId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CodeBattle", CodeBattleSchema);
