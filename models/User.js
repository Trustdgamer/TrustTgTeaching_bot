

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  tgId: { type: String, required: true, unique: true },
  id: { type: String, required: true, unique: true },

  username: String,
  displayName: String,
  first_name: String,

  points: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },

  battlesWon: { type: Number, default: 0 },
  battlesLost: { type: Number, default: 0 },

  lastActive: Number,
  lastLogin: String,

  premiumUntil: Number,
  premium: {
    isPremium: { type: Boolean, default: false },
    expiresAt: Number
  },

  inbox: [
    {
      title: String,
      message: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

// ✅ VERY IMPORTANT (prevents overwrite + broken exports)
module.exports =
  mongoose.models.User || mongoose.model("User", UserSchema);

