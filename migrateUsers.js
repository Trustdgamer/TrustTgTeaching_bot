require("dotenv").config();
const mongoose = require("mongoose");
const users = require("./users.json");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI);

(async () => {
  for (const tgId in users) {
    const u = users[tgId];

    await User.updateOne(
      { tgId },
      {
        $set: {
          tgId,
          id: u.id,
          username: u.username,
          first_name: u.first_name,
          points: u.points,
          coins: u.coins,
          usageCount: u.usageCount,
          lastActive: u.lastActive,
          lastLogin: u.lastLogin,
          premiumUntil: u.premiumUntil,
          premium: u.premium,
          badge: u.badge,
          badgeExpires: u.badgeExpires,
          lastMysteryBox: u.lastMysteryBox
        }
      },
      { upsert: true }
    );
  }

  console.log("✅ Users migrated successfully");
  process.exit();
})();
