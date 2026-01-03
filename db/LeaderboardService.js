const User = require("./models/User");

async function getUserRankByCoins(coins) {
  const count = await User.countDocuments({
    coins: { $gt: coins }
  });

  // rank = number of users above + 1
  return count + 1;
}

module.exports = {
  getUserRankByCoins
};
