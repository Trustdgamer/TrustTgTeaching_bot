const { saveUsers } = require('./index'); // adjust path if needed
const users = require('./users.json');    // or pass users from index.js

function checkPremiumExpiry(bot) {
  const now = Date.now();
  let updated = false;

  // users is an object, so iterate with for...in
  for (const userId in users) {
    const user = users[userId];

    if (user.premium && user.premium.isPremium && user.premium.expiresAt <= now) {
      // Remove premium status
      user.premium.isPremium = false;
      user.badge = null;

      // Optionally remove from premium group if you store it
      if (user.premiumGroupId) {
        bot.kickChatMember(user.premiumGroupId, userId)
          .catch(err => console.error("Error removing from group:", err));
      }

      // Notify user
      bot.sendMessage(userId, "⚠️ Your premium subscription has expired.");
      updated = true;
    }
  }

  if (updated) saveUsers(); // persist changes
}

module.exports = { checkPremiumExpiry };
