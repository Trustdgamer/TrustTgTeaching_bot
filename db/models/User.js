const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  tgId: { type: String, required: true, unique: true },
  username: String,
  first_name: String,
  last_name: String,

  coins: { type: Number, default: 0 },

  premium: {
    isPremium: { type: Boolean, default: false },
    expiresAt: { type: Number, default: null }
  },

  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

/**
 * 🔑 IMPORTANT FIX
 * Reuse model if already compiled
 */
module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
