const User = require("../models/User");

// 🔎 Find by INTERNAL ID (your bot ID)
async function getUserByInternalId(internalId) {
  return await User.findOne({ id: internalId });
}

// 🔎 Find by Telegram ID
async function getUserByTelegramId(tgId) {
  return await User.findOne({ tgId });
}

// db/userService.js
async function getUserRankByCoins(coins) {
  const User = require("../models/User");
  return (await User.countDocuments({ coins: { $gt: coins } })) + 1;
}

module.exports = { getUserRankByCoins };

// db/userService.js


/**
 * Add or remove coins from a user
 */
async function updateUserCoins(telegramId, amount) {
  return await User.findOneAndUpdate(
    { tgId: telegramId },
    { $inc: { coins: amount } },
    { new: true }
  );
}



module.exports = {
  updateUserCoins
};



module.exports = {
  getUserByInternalId,
  getUserByTelegramId
};
