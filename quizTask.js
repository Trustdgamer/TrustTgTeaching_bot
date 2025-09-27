function checkPremiumExpiry(bot) {
    const now = Date.now();
    let updated = false;

    users.forEach((user, id) => {
        if (user.premium && user.premiumExpiry && now > user.premiumExpiry) {
            // Remove premium status
            user.premium = false;
            user.badge = null;

            // Optionally remove from premium group
            if (user.premiumGroupId) {
                bot.kickChatMember(user.premiumGroupId, user.tgId)
                   .catch(err => console.error("Error removing from group:", err));
            }

            bot.sendMessage(user.tgId, "⚠️ Your premium subscription has expired.");
            updated = true;
        }
    });

    if (updated) {
        saveUsers(); // Save updated user data
    }
}

module.exports = { checkPremiumExpiry };
