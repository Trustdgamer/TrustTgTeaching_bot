const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  tgId: String,
  internalId: mongoose.Schema.Types.ObjectId,
  name: String,
  badge: String,
  joinedAt: Number,
  submitted: Boolean,
  solved: Boolean,
  time: Number
});

const BattleSchema = new mongoose.Schema({
  code: String,
  host: String,
  status: String,
  password: String,
  tier: String,
  problem: Object,
  endsAt: Number,
  players: { type: Map, of: PlayerSchema }
});

module.exports = mongoose.model("Battle", BattleSchema);
