// db/models/LeaderboardMeta.js
const mongoose = require("mongoose");

const LeaderboardMetaSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  lastWeeklyResetAt: Number,
  lastWeeklySnapshot: { type: Object, default: {} }
});

module.exports = mongoose.model("LeaderboardMeta", LeaderboardMetaSchema);
