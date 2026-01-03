// db/models/Leaderboard.js
const mongoose = require("mongoose");

const LeaderboardSchema = new mongoose.Schema({
  tgId: { type: String, unique: true },
  mainPoints: { type: Number, default: 0 },
  weeklyPoints: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  lastWeekRank: Number
});

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
