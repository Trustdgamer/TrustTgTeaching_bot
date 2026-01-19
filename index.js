//require('dotenv').config();
require("dotenv").config();
const { exec } = require("child_process");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
//const mongoose = require("mongoose");
//const { getUserRankByCoins } = require("./db/LeaderboardService");
const connectMongo = require("./db/connectMongo");

(async () => {
  await connectMongo();
})();


function escapeHTML(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/*mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true 
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));*/
//const User = require("./models/User");
const User = require("./models/User");

async function getUserRankByCoins(coins) {
  // Count users who have MORE coins than this user
  const higherUsers = await User.countDocuments({
    coins: { $gt: coins }
  });

  // Rank is number of users ahead + 1
  return higherUsers + 1;
}
async function getUser(tgUser) {
  let user = await User.findOne({ tgId: tgUser.id.toString() });

  if (!user) {
    user = await User.create({
      tgId: tgUser.id.toString(),
      id: generateUniqueId(), // 🔥 INTERNAL ID
      username: tgUser.username,
      first_name: tgUser.first_name,
      coins: 0,
      points: 0,
      lastActive: Date.now()
    });
  }

  return user;
}



// Utils
const utils = require("./utils");

// Admin IDs
const ADMIN_IDS = ["6499793556"];

// Load data
//const users = Object.freeze(readJSON("./users.json") || {});


//const users = readJSON("./users.json") || {};
//const leaderboard = readJSON("./leaderboard.json") || {};
const battles = readJSON("./battles.json") || { battles: [] };

// ----------------- API ROUTES -----------------

// Get users
app.get("/api/users", (req, res) => {
  if (!ADMIN_IDS.includes(req.query.admin)) return res.status(403).send("Unauthorized");
  res.json(users);
});

// Get leaderboard
app.get("/api/leaderboard", (req, res) => {
  if (!ADMIN_IDS.includes(req.query.admin)) return res.status(403).send("Unauthorized");
  res.json(leaderboard);
});

// Get battles
app.get("/api/battles", (req, res) => {
  if (!ADMIN_IDS.includes(req.query.admin)) return res.status(403).send("Unauthorized");
  res.json(battles);
});

// Give coins (monetization)
/*app.get("/api/give-coins", (req, res) => {
  if (!ADMIN_IDS.includes(req.query.admin)) return res.status(403).send("Unauthorized");

  const uid = req.query.uid;
  const amt = parseInt(req.query.amt, 10);

  if (!users[uid]) return res.send("User not found");
  if (isNaN(amt)) return res.send("Invalid amount");

  users[uid].coins = (users[uid].coins || 0) + amt;
  saveJSON("./users.json", users);
  res.send(`✅ Gave ${amt} coins to ${uid}`);
});*/

// ----------------- DASHBOARD STATIC FILES -----------------

// Simple admin auth for dashboard
app.use("/dashboard", (req, res, next) => {
  if (!req.query.admin || !ADMIN_IDS.includes(req.query.admin)) {
    return res.status(403).send("🚫 Unauthorized");
  }
  next();
});

// Serve static dashboard
app.use("/dashboard", express.static(path.join(__dirname, "dashboard")));

// ----------------- DEFAULT ROUTE -----------------
app.get('/', (req, res) => {
  res.send('🤖 TrustBuddyBot is alive!');
});

// ----------------- START SERVER -----------------
app.listen(PORT, () => {
  console.log(`🌐 Dashboard running at http://localhost:${PORT}/dashboard`);
  console.log(`🌐 Web service running at http://localhost:${PORT}/`);
});


const { checkPremiumExpiry } = require('./quizTask'); // adjust path
// import { exec } from "child_process";

function isPremium(user) {
  if (!user) return false;
  if (!user.premium) return false;
  if (!user.premium.isPremium) return false;
  if (!user.premium.expiresAt) return false;

  return Date.now() < user.premium.expiresAt;
}

function getDisplayName(user) {
    const info = getPremiumInfo(user); // uses our premium helper
    let badge = "";

    if (info.isPremium) badge += "💎 "; // Premium badge
    if (user.badge && (!user.badgeExpires || user.badgeExpires > Date.now())) {
        badge += user.badge + " "; // other badges if any
    }

    return badge + (user.name || user.displayName || "Unknown");
}

function formatRemainingTime(ms) {
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}




/*function loadJSON(path) {
  try {
    if (!fs.existsSync(path)) return {};
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    console.error('Error loading JSON from', path, e);
    return {};
  }
}*/


// Command registry
const commands = [];

function registerCommand(regex, description, handler) {
  if (typeof handler !== "function") {
    console.error("❌ Tried to register command without a valid handler:", regex);
    return;
  }

  commands.push({ regex, description, handler });

  bot.onText(regex, (msg, match) => {
    try {
      handler(msg, match);
    } catch (err) {
      console.error(`Error in command ${regex}:`, err);
      bot.sendMessage(msg.chat.id, "⚠️ Something went wrong running this command.");
    }
  });
}





//let users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));



//onst path = './users.json';
//const mailboxFile = './mailboxes.json';

function readMailboxes() {
  try {
    return JSON.parse(fs.readFileSync(mailboxFile));
  } catch {
    return {};
  }
}

/*unction writeMailboxes(data) {
  fs.writeFileSync(mailboxFile, JSON.stringify(data, null, 2));
}*/
const { v4: uuidv4 } = require('uuid');  // npm i uuid

function addMailToUser(userId, mail) {
  const mailboxes = readMailboxes();

  if (!mailboxes[userId]) mailboxes[userId] = [];

  mailboxes[userId].push({
    id: uuidv4(),
    from: mail.from,
    subject: mail.subject,
    body: mail.body,
    timestamp: Date.now(),
    read: false
  });

  writeMailboxes(mailboxes);
}



function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}


let rooms = readJSON('./rooms.json');

function saveRooms() {
  writeJSON('./rooms.json', rooms);
}

function createRoom(roomCode, hostId, password = '') {
  if (rooms[roomCode]) {
    return false; // Room code already exists
  }
  rooms[roomCode] = {
    roomCode,
    hostId,
    password,         // optional
    players: [],      // array of { userId, username, score }
    timer: 5 * 60,    // default 5 minutes in seconds
    startTime: null,
    isStarted: false
  };
  saveRooms();
  return true;
}

function addPlayerToRoom(roomCode, userId, username) {
  const room = rooms[roomCode];
  if (!room) return false;
  if (room.players.find(p => p.userId === userId)) return false; // already joined

  room.players.push({ userId, username, score: 0 });
  saveRooms();
  return true;
}
const { renderScores } = require("./utils/renderScores");

function endMultiBattle(battle, chatId) {
  battle.status = "ended";

  // 🏆 Sort players
  const playersArr = Object.values(battle.players)
    .sort((a, b) => b.score - a.score);

  const winner = playersArr[0];

  const scoreText = renderScores(battle.players);

  // 📊 Send score summary
  bot.sendMessage(
    chatId,
    `🏁 <b>MultiBattle Finished!</b>\n\n` +
    `🏆 <b>Winner:</b> ${winner.name}\n\n` +
    `${scoreText}`,
    { parse_mode: "HTML" }
  );

  // 📈 Update leaderboard
  const lb = readLeaderboard();
  const season = lb.currentSeason;

  for (const p of playersArr) {
    lb.scores[p.id] ??= { total: 0, seasons: {} };
    lb.scores[p.id].total += p.score;
    lb.scores[p.id].seasons[season] =
      (lb.scores[p.id].seasons[season] || 0) + p.score;
  }

  writeLeaderboard(lb);
}

function cleanupRooms() {
  const data = readBattles(); // or readRooms() if you use rooms.json
  const now = Date.now();
  let changed = false;

  data.battles = data.battles.filter(room => {
    // Delete if older than 1 hour
    if (room.createdAt && now - room.createdAt > 3600 * 1000) {
      changed = true;
      return false; // remove room
    }

    // Delete if no players
    if (!room.players || Object.keys(room.players).length === 0) {
      changed = true;
      return false;
    }

    // Delete if host left (host ID not in players)
    if (!room.players[room.host]) {
      changed = true;
      return false;
    }

    return true; // keep room
  });

  if (changed) {
    writeBattles(data);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRooms, 5 * 60 * 1000);
// Load users progress (extend your existing users.json)


// Save users.json helper (reuse your existing writeJSON)


/*function formatName(user) {
  let badge = "";
  if (user.isPremium && user.premiumExpires > Date.now()) badge += "💎 ";
  if (user.badge && (!user.badgeExpires || user.badgeExpires > Date.now())) badge += user.badge + " ";
  return badge + (user.name || "Unknown");
}*/


const motivationalQuotes = [
  "“Code is like humor. When you have to explain it, it’s bad.” – Cory House",
  "“First, solve the problem. Then, write the code.” – John Johnson",
  "“Experience is the name everyone gives to their mistakes.” – Oscar Wilde",
  // add more...
];

const funFacts = [
  "The first computer bug was an actual moth stuck in a relay.",
  "JavaScript was created in just 10 days.",
  "The original name for JavaScript was Mocha.",
  // add more...
];

const roasts = [
  "That code looks like it was written by a sleeping cat walking on a keyboard!",
  "If I wanted to see spaghetti, I'd order dinner.",
  "This code throws more errors than a soap opera script.",
  // add more...
];

const easterEggs = [
  "🐰 You found a hidden egg! Keep coding, you rock!",
  "🎉 Surprise! Did you know that debugging is twice as hard as writing the code?",
  "✨ Keep exploring! The best coders are curious and creative.",
  // add more...
];


/*function getUserId(msg) {
  const chatId = msg.chat.id.toString();
  if (!users[chatId]) {
    users[chatId] = {
      id: generateUniqueId(),
      points: 0,
      lastActive: Date.now()
    };
    writeJSON('./users.json', users);
  } else {
    users[chatId].lastActive = Date.now();
    writeJSON('./users.json', users);
  }
  return users[chatId].id;
}*/

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}


// ===== Load and parse structured lessons =====
let lessons = {};
try {
  const rawCourses = fs.readFileSync('./structured_python_lessons.json', 'utf-8');
  lessons = JSON.parse(rawCourses);
} catch (err) {
  console.error('❌ Error loading lessons:', err.message);
}

// ===== Bot Setup =====
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
//const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const userProgress = {};
const userBookmarks = {};
const userCodeRuns = {};

// ===== Helper to format lesson for Telegram =====
function formatLesson(lesson) {
  return (
    `📘 <b>${lesson.title}</b>\n\n` +
    `<b>🧠 Explanation:</b>\n${lesson.explanation}\n\n` +
    `<b>💻 Code Example:</b>\n<pre><code>${lesson.code_example}</code></pre>\n\n` +
    `<b>📝 Task:</b>\n${lesson.task}`
  );
}

function notifyUnreadMail(userId, chatId) {
  const mailboxes = readMailboxes();
  if (!mailboxes[userId]) return;

  const unreadCount = mailboxes[userId].filter(m => !m.read).length;
  if (unreadCount > 0) {
    bot.sendMessage(chatId, `📬 You have ${unreadCount} unread message(s). Use /inbox to read them.`);
  }
}

bot.onText(/\/start$/, (msg) => {
  const userId = msg.from.id.toString();
  const chatId = msg.chat.id;
  // Your existing start logic ...

  notifyUnreadMail(userId, chatId);
});


// Command groups text
const commandGroups = {
  mainMenu: `<b>👋 Welcome to TrustBuddyBot!</b>\n\nSelect a command category below:`,

  courses: Object.keys(lessons).map(lang => `- /start_${lang}`).join('\n'),

  multiplayer: 
`/battle create — Create multiplayer battle room
/battle join <code> — Join battle room
/battle startgame <code> — Start battle timer (host only)
/battle submit <code> <output> — Submit solution
/battle leave <code> — Leave battle
/battle status <code> — Show battle status
/battle rooms — Show available rooms
/battle delete <code> - Delete a room
/leaderboard - Show top scorers
/battle timeleft <code> — Show remaining time`,
 premiumCourses:
`/premiumcourses — View exclusive premium-only courses
  - AI Development Masterclass 🤖
  - Blockchain & Smart Contracts ⛓
  - Cybersecurity Expert Track 🛡
  - Secret Pro Lessons 🔒`,
  utilities:
`/next — Continue to next lesson
/getgroupid - To get group id
/myid - show your bot id
/myinfo - To check your info
/mystats - To ccheck your stats
/reset — Restart current course
/nanoai — Ask any programming question
/search <term> — Search lessons by keyword
/bookmark — Bookmark current lesson
/bookmarks — List your bookmarks
/run js <code> — Run JavaScript code
/stats — View your stats & ranking
/ping — Check if bot is alive
/runtime — Show bot uptime
/time — Show server time
/status — Show memory usage
/announce — Admin: send announcement
/inbox — Check your mail inbox
/read <id> — Mark a mail as read
/delete <id> — Delete a mail
/leaderboard_main - Main Leaderboard
/leaderboard_week - Weekly Leaderboard
/myinfo - User info`,

  learningTools:
`/quizmode — Start a 15-minute timed quiz challenge
/stopquiz - To stop quiz
/topquiz - Check top quiz 
/codebattle - Challenge another user to a code battle
/task — Get your daily coding task
/debug <code> — Let the bot explain & fix code errors
/translate <text> <lang> — Translate text to another language`,

  economy:
`/shop — View shop items & perks
/buy - buy an item from the shop, eg /buy 100 coins
/buycoins <amount> — Buy coins from admin
/buypremium <days> — Buy premium access for days/weeks
/premiumstatus - Check your premium subscription status
/balance — Check your coin balance`,

  fun:
`/motivate — Get a motivational coding quote
/funfact — Get a random programming fact
/roastcode — Playfully roast bad code
/mysterybox - Open your daily mystery box (coins, premium,andmin panel, or badge!)
/codebattle - Challenge another user to a code battle
/easteregg — Discover hidden surprises`,

  premium:
`To unlock premium courses & perks, contact <a href="https://t.me/KallmeTrust">Dev Trust</a>
`
};



// ======= /start command =======
// Track users waiting to enter their name
let waitingForName = {};

// Register user function (safe against missing data)
async function registerUser(msg, nameInput) {
  if (!msg || !msg.chat || !msg.from) return;

  const tgId = msg.from.id.toString();
  let user = await User.findOne({ tgId });

  if (!user) {
    user = await User.create({
      tgId: tgId,
      id: generateUniqueId(), // internal bot ID
      chatId: msg.chat.id.toString(),
      displayName: nameInput || msg.from.first_name || "Unknown",
      username: msg.from.username || "",
      points: 0,
      coins: 0,
      battlesWon: 0,
      battlesLost: 0,
      lastActive: Date.now(),
      registeredAt: Date.now(),
      premium: { isPremium: false, expiresAt: null },
    });
  } else {
    if (nameInput) user.displayName = nameInput;
    user.lastActive = Date.now();
    await user.save();
  }

  return user;
}

/*function registerUser(msg, nameInput) {
  if (!msg || !msg.chat || !msg.from) {
    console.error("registerUser called without a valid Telegram message object");
    return;
  }

  const chatId = msg.chat.id.toString();
  const userId = msg.from.id.toString();

  if (!users[userId]) {
    // new user
    users[userId] = {
      id: userId, // use Telegram userId as unique identifier
      chatId,
      displayName: nameInput || msg.from.first_name || "Unknown",
      username: msg.from.username || "",
      points: 0,
      coins: 0,
      battlesWon: 0,
      battlesLost: 0,
      lastActive: Date.now(),
      registeredAt: Date.now(),
    };
  } else {
    // existing user — update name if provided, and last active
    if (nameInput) users[userId].displayName = nameInput;
    users[userId].lastActive = Date.now();
  }

  saveUsers(); // make sure to persist
}*/


// Start command

//const User = require("./models/User");

setInterval(async () => {
  try {
    const expiredUsers = await User.find({
      "premium.isPremium": true,
      "premium.expiresAt": { $lte: Date.now() }
    });

    for (const user of expiredUsers) {
      user.premium.isPremium = false;
      await user.save();

      console.log(`🔻 Premium expired for ${user.username || user.id}`);
    }

    if (expiredUsers.length > 0) {
      console.log("✅ Premium expiration check completed");
    }
  } catch (err) {
    console.error("❌ Premium expiry job failed:", err);
  }
}, 5 * 60 * 1000);


  /*for (const userId in users) {
    const { getUserByInternalId } = require("./db/userService");

const user = await getUserByInternalId(userId);
if (!user) return;


    if (
      user.premium &&
      user.premium.isPremium &&
      user.premium.expiresAt <= Date.now()
    ) {
      user.premium.isPremium = false;
      changed = true;
      console.log(`🔻 Premium expired for ${userId}`);
    }
  }

  if (changed) saveUsers();
}, 5 * 60 * 1000);

const usersPath = './users.json';

function saveUsers() {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}
setInterval(() => {
  let changed = false;

  for (const userId in users) {
    const user = users[userId];

    if (
      user.premium &&
      user.premium.isPremium &&
      user.premium.expiresAt <= Date.now()
    ) {
      user.premium.isPremium = false;
      changed = true;
      console.log(`🔻 Premium expired for ${userId}`);
    }
  }

  if (changed) saveUsers();
}, 5 * 60 * 1000);*/

// /start command
const REQUIRED_CHANNEL = "@Ttrustbit"; // replace with your channel username

async function checkMembership(userId) {
  try {
    const member = await bot.getChatMember(REQUIRED_CHANNEL, userId);
    return ["creator", "administrator", "member"].includes(member.status);
  } catch (err) {
    console.error("Membership check failed:", err);
    return false;
  }
}

bot.onText(/\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const tgId = msg.from.id.toString();
  const username = msg.from.username || "";

  // Channel check
  const isMember = await checkMembership(tgId);
  if (!isMember) {
    return bot.sendMessage(
      chatId,
      `🚨 You must join our channel to use this bot.\n👉 ${REQUIRED_CHANNEL}`
    );
  }

  const { getUserByTelegramId } = require("./db/userService");
  let user = await getUserByTelegramId(tgId);

  if (!user) {
    waitingForName[tgId] = { username };

    return bot.sendMessage(
      chatId,
      `👋 Welcome!\n\nPlease enter your display name:`,
      { parse_mode: "HTML" }
    );
  }

  await giveDailyBonusMongo(user, chatId);
  notifyUnreadMail(user.id, chatId);
  showWelcomeMenu(msg);
});



// Capture name for first-time users
bot.on("message", async (msg) => {
  const tgId = msg.from.id.toString();

  if (waitingForName[tgId] && msg.text && !msg.text.startsWith("/")) {
    const name = msg.text.trim();
    const { username } = waitingForName[tgId];

    const User = require("./models/User");

    const user = await User.create({
      tgId,
      id: generateUniqueId(),
      username,
      displayName: name,
      coins: 0,
      points: 0,
      usageCount: 1,
      lastLogin: new Date().toDateString(),
      battlesWon: 0,
      battlesLost: 0,
      premium: { isPremium: false, expiresAt: null }
    });

    delete waitingForName[tgId];

    bot.sendMessage(
      msg.chat.id,
      `✅ Thanks <b>${escapeHTML(name)}</b>! You are now registered.`,
      { parse_mode: "HTML" }
    );

    notifyUnreadMail(user.id, msg.chat.id);
    showWelcomeMenu(msg);
  }
});


bot.on("message", async (msg) => {
  if (!msg.from?.id) return;

  const tgId = msg.from.id.toString();
  const User = require("./models/User");

  try {
    await User.updateOne(
      { tgId: tgId },
      { $set: { lastActive: Date.now() } }
    );
  } catch (err) {
    console.error("lastActive update failed:", err.message);
  }
});


async function generateAIQuestion(
  difficulty = "medium",
  topic = "algorithms"
) {
  const prompt = `
You are a competitive programming problem generator.

Generate ONE coding challenge.
Difficulty: ${difficulty}
Topic: ${topic}

STRICT RULES:
- Respond with JSON ONLY
- No markdown
- No explanation
- No backticks

Format:
{
  "title": "string",
  "description": "string",
  "expected_output": "string"
}
`;

  const aiUrl = `https://api-rebix.vercel.app/api/gptlogic?q=${encodeURIComponent(
    "Generate a coding challenge"
  )}&prompt=${encodeURIComponent(prompt)}`;

  const res = await fetch(aiUrl);
  if (!res.ok) throw new Error("AI API failed");

  const data = await res.json();

  let text = data.response;
  if (!text) throw new Error("Empty AI response");

  // 🧹 Clean accidental formatting
  text = text.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("❌ AI JSON ERROR:", text);
    throw new Error("Invalid AI JSON");
  }

  return {
    id: "ai-" + Date.now(),
    title: parsed.title || "AI Coding Challenge",
    description: parsed.description || "Solve the problem",
    input: "",
    expected_output: String(parsed.expected_output || "").trim()
  };
}


async function createDailyTournament() {
  const questions = [];

  for (let i = 0; i < 5; i++) {
    const q = await generateAIQuestion("hard");
    if (q) questions.push(q);
  }

  if (!questions.length) return;

  startMultiBattle({
    mode: "daily",
    questions,
    rewardMultiplier: 2,
    teamsEnabled: true
  });
}


async function giveDailyBonusMongo(user, chatId) {
  const today = new Date().toDateString();

  user.usageCount = (user.usageCount || 0) + 1;

  if (user.lastLogin !== today) {
    const bonus = 10;
    user.coins += bonus;
    user.lastLogin = today;

    await user.save();

    bot.sendMessage(chatId, `🎁 Daily login bonus: +${bonus} coins!`);
  } else {
    await user.save();
  }
}


// Show welcome menu
function showWelcomeMenu(msg) {
  const chatId = msg.chat.id;

  bot.sendPhoto(chatId, fs.readFileSync('./welcome.png'), {
    caption: commandGroups.mainMenu,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: '📚 Courses', callback_data: 'show_courses' }],
        [{ text: '⚔️ Multiplayer Commands', callback_data: 'show_multiplayer' }],
        [{ text: 'Premium courses', callback_data: 'show_premiumCourses' }],
        [{ text: '🛠 Utility Commands', callback_data: 'show_utilities' }],
        [{ text: '🧠 Learning Tools', callback_data: 'show_learningtools' }],
        [{ text: '💰 Economy & Shop', callback_data: 'show_economy' }],
        [{ text: '🎉 Fun Commands', callback_data: 'show_fun' }],
        [{ text: '⭐ Premium Info', callback_data: 'show_premium' }]
      ]
    }
  }).catch(err => {
    console.error('Failed to send welcome photo:', err.message);
    bot.sendMessage(chatId, commandGroups.mainMenu, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: '📚 Courses', callback_data: 'show_courses' }],
          [{ text: '⚔️ Multiplayer Commands', callback_data: 'show_multiplayer' }],
          [{ text: 'Premium courses', callback_data: 'show_premiumCourses' }],
          [{ text: '🛠 Utility Commands', callback_data: 'show_utilities' }],
          [{ text: '🧠 Learning Tools', callback_data: 'show_learningtools' }],
          [{ text: '💰 Economy & Shop', callback_data: 'show_economy' }],
          [{ text: '🎉 Fun Commands', callback_data: 'show_fun' }],
          [{ text: '⭐ Premium Info', callback_data: 'show_premium' }]
        ]
      }
    });
  });
}



// Escape HTML for safety in callback replies
function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Handle inline keyboard button clicks
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  const data = callbackQuery.data;

  let text = '';
  let buttons = [
    [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
  ];

  switch (data) {
    case 'show_courses':
      text = `<b>Available Courses:</b>\n${escapeHTML(commandGroups.courses)}`;
      break;
    case 'show_multiplayer':
      text = `<b>Multiplayer Commands:</b>\n${escapeHTML(commandGroups.multiplayer)}`;
      break;
    case 'show_premiumCourses':
      text = `<b>Premium Courses:</b>\n${escapeHTML(commandGroups.premiumCourses)}`;
      break;
    case 'show_utilities':
      text = `<b>Utility Commands:</b>\n${escapeHTML(commandGroups.utilities)}`;
      break;
    case 'show_learningtools':
      text = `<b>Learning Tools:</b>\n${escapeHTML(commandGroups.learningTools)}`;
      break;
    case 'show_economy':
      text = `<b>Economy & Shop:</b>\n${escapeHTML(commandGroups.economy)}`;
      break;
    case 'show_fun':
      text = `<b>Fun Commands:</b>\n${escapeHTML(commandGroups.fun)}`;
      break;
    case 'show_premium':
      text = commandGroups.premium; // HTML content, no escaping
      break;
    case 'main_menu':
    default:
      text = commandGroups.mainMenu;
      buttons = [
        [{ text: 'Courses', callback_data: 'show_courses' }],
        [{ text: 'Multiplayer Commands', callback_data: 'show_multiplayer' }],
        [{ text: 'Utility Commands', callback_data: 'show_utilities' }],
        [{ text: '🧠 Learning Tools', callback_data: 'show_learningtools' }],
        [{ text: '💰 Economy & Shop', callback_data: 'show_economy' }],
        [{ text: 'Fun Commands 🎉', callback_data: 'show_fun' }],
        [{ text: 'Premium Info', callback_data: 'show_premium' }]
      ];
      break;
  }

  try {
    await bot.deleteMessage(chatId, messageId);
    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: buttons }
    });
  } catch (err) {
    console.error('Failed to delete or send message:', err.message);
  }

  await bot.answerCallbackQuery(callbackQuery.id);
});

// Load premium privileges list once
const premiumPrivileges = [
  "🌟 Access to exclusive commands",
  "⚡ Faster response priority",
  "🎁 Monthly bonus points",
  "💬 Private chat support",
  "🏆 Higher leaderboard visibility",
  "🔒 Early access to new features"
];

// Helper to escape markdown special chars in usernames/names
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

registerCommand(
  /\/check/,
  "Check your profile (coins & premium status)",
  async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id.toString();

    const { getUserByTelegramId } = require("./db/userService");
    const user = await getUserByTelegramId(tgId);

    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start first.");
    }

    const isPremium =
      user.premium?.isPremium && user.premium.expiresAt > Date.now();

    let premiumText = "❌ No";
    if (isPremium) {
      premiumText =
        `✅ Yes\n⏳ <b>Remaining:</b> ${formatRemainingTime(
          user.premium.expiresAt - Date.now()
        )}`;
    }

    bot.sendMessage(
      chatId,
      `📌 <b>Your Profile</b>\n\n` +
      `🆔 ID: <code>${user.id}</code>\n` +
      `💰 Coins: <b>${user.coins}</b>\n` +
      `💎 Premium: ${premiumText}`,
      { parse_mode: "HTML" }
    );
  }
);




registerCommand(
  /\/profile(?:\s+(\S+))?/,
  "View your profile or another user's profile",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const fromTgId = msg.from.id.toString();
    const requestedArg = match[1]?.trim();

    const { getUserByTelegramId, getUserByInternalId, getUserByUsername } =
      require("./db/userService");

    const user = await getUserByTelegramId(fromTgId);
    if (!user) {
      return bot.sendMessage(
        chatId,
        "❌ You are not registered. Please use /start first."
      );
    }

    let targetUser = user;

    // 🔍 lookup other user
    if (requestedArg) {
      targetUser =
        (await getUserByInternalId(requestedArg)) ||
        (await getUserByUsername(requestedArg));

      if (!targetUser) {
        return bot.sendMessage(
          chatId,
          `❌ No user found with ID or username "${requestedArg}".`
        );
      }
    }

    // ===== Premium / Tier =====
    let tier = "free";
    let tierIcon = "🆓";
    let premiumText = "❌ No";

    if (
      targetUser.premium?.isPremium &&
      targetUser.premium.expiresAt > Date.now()
    ) {
      const ms = targetUser.premium.expiresAt - Date.now();
      const days = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);

      if (days >= 30) {
        tier = "legend";
        tierIcon = "👑";
      } else if (days >= 15) {
        tier = "vip";
        tierIcon = "💎";
      } else if (days >= 8) {
        tier = "pro";
        tierIcon = "🔥";
      } else {
        tier = "premium";
        tierIcon = "🌟";
      }

      premiumText = `✅ Yes (${days}d ${hours}h ${minutes}m ${seconds}s)`;
    }

    let nameDisplay =
      targetUser.displayName || targetUser.name || "Unknown";

    if (
      targetUser.premium?.isPremium &&
      targetUser.premium.expiresAt > Date.now()
    ) {
      nameDisplay = "💎 " + nameDisplay;
    }

    const usernameDisplay = targetUser.username
      ? "@" + escapeMarkdown(targetUser.username)
      : "No username";

    const joinedDate = targetUser.createdAt
      ? new Date(targetUser.createdAt).toDateString()
      : "Unknown";

    const profileText = `📜 *User Profile*
────────────────
👤 Name: *${escapeMarkdown(nameDisplay)}*
💬 Username: ${usernameDisplay}
🏆 Coins: *${targetUser.coins || 0}*
${tierIcon} Tier: *${tier.toUpperCase()}*
💎 Premium: ${premiumText}
📅 Joined: *${joinedDate}*`;

    bot.sendMessage(chatId, profileText, { parse_mode: "Markdown" });
  }
);









// Call this when a user is upgraded to premium
function sendPremiumWelcome(bot, chatId, name) {
  const listText = premiumPrivileges.map((p, i) => `${i + 1}. ${p}`).join("\n");

  const welcomeText = `
🎉 Congratulations, *${escapeMarkdown(name)}*!  
You are now a *Premium Member* 🌟

Here are your privileges:
${listText}
`;

  bot.sendMessage(chatId, welcomeText, { parse_mode: "Markdown" });
}

// ===== Premium-only topics =====
const premiumTopics = ['cheatsheetwebdev', 'simplewebcreating'];

// ===== /start_<topic> command =====
registerCommand(/\/start_(\w+)/, "Start a course by topic name (example: /start_python)", async (msg, match) => {
  const chatId = msg.chat.id;
  const topic = match[1].toLowerCase();


  async function requirePremiumMongo(chatId, tgId) {
  const { getUserByTelegramId } = require("./db/userService");
  const user = await getUserByTelegramId(tgId.toString());

  if (
    !user ||
    !user.premium?.isPremium ||
    user.premium.expiresAt <= Date.now()
  ) {
    bot.sendMessage(chatId, "❌ This feature is Premium-only.");
    return false;
  }
  return true;
}
  // Check premium restriction
 if (premiumTopics.includes(topic) && !(await requirePremiumMongo(chatId, msg.from.id))) {
  return;
}


  // Check if lessons exist
  if (!lessons[topic]) {
    return bot.sendMessage(chatId, "❌ Course not found. Please check the topic name.");
  }

  // Initialize user progress
  userProgress[chatId] = { topic, index: 0 };

  // Send first lesson
  const firstLesson = lessons[topic][0];
  bot.sendMessage(chatId, formatLesson(firstLesson), { parse_mode: "HTML" });
});


// ===== /next command =====

function getUserProgress(userId, course) {
  if (!userProgress[userId]) userProgress[userId] = {};
  if (userProgress[userId][course] === undefined) userProgress[userId][course] = 0;
  return userProgress[userId][course];
}

function setUserProgress(userId, course, index) {
  if (!userProgress[userId]) userProgress[userId] = {};
  userProgress[userId][course] = index;
}
bot.onText(/\/testmail/, async (msg) => {
  const { addMailToUser } = require("./db/mailService");

  await addMailToUser(msg.from.id, {
    subject: "✅ Test Mail",
    body: "If you see this, inbox works 🎉"
  });

  bot.sendMessage(msg.chat.id, "📬 Test mail sent. Use /inbox");
});

registerCommand(/\/next(?:\s+(\S+))?/, "Go to the next lesson (default: cheatsheetwebdev)", (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const course = match[1]?.toLowerCase() || (userProgress[userId]?.topic || "cheatsheetwebdev"); // use last started course if available

  const lessonsForCourse = lessons[course];
  if (!lessonsForCourse) {
    return bot.sendMessage(chatId, "❌ Course not found. Use /start_<course> first.");
  }

  const lessonIndex = getUserProgress(userId, course);

  if (lessonIndex >= lessonsForCourse.length) {
    return bot.sendMessage(chatId, "🎉 You have completed all lessons in this course!");
  }

  const lesson = lessonsForCourse[lessonIndex];
  setUserProgress(userId, course, lessonIndex + 1);

  // Build safe message
  let message = `<b>${lesson.title}</b>\n\n${lesson.explanation}`;

  if (lesson.code_example && lesson.code_example.trim() !== "") {
    message += `\n\n<pre><code>${lesson.code_example}</code></pre>`;
  }

  if (lesson.task && lesson.task.trim() !== "") {
    message += `\n\n<b>Task:</b> ${lesson.task}`;
  }

  bot.sendMessage(chatId, message, { parse_mode: "HTML" });
});



// ==================== /getgroupid ====================
registerCommand(/\/getgroupid/, "Get the current group's chat ID", (msg) => {
  const chatId = msg.chat.id;

  if (msg.chat.type === "private") {
    return bot.sendMessage(chatId, "❌ This command only works inside groups.");
  }

  bot.sendMessage(chatId, `🆔 Group ID: <b>${chatId}</b>`, { parse_mode: "HTML" });
});

// Utility: split long text into safe Telegram chunks
function splitMessage(text, maxLength = 4000) {
  const parts = [];
  while (text.length > 0) {
    if (text.length > maxLength) {
      // cut at nearest line break or space
      let sliceEnd = text.lastIndexOf("\n", maxLength);
      if (sliceEnd === -1) sliceEnd = text.lastIndexOf(" ", maxLength);
      if (sliceEnd === -1) sliceEnd = maxLength;
      parts.push(text.slice(0, sliceEnd));
      text = text.slice(sliceEnd).trim();
    } else {
      parts.push(text);
      break;
    }
  }
  return parts;
}

/*registerCommand(
  /\/restart$/,
  "Restart the bot process",
  (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "♻️ Restarting bot...").then(() => {
      exec("pm2 restart all", (error) => {
        if (error) {
          console.error("Restart error:", error);
          bot.sendMessage(chatId, "❌ Restart failed. Check server logs.");
        }
      });
    });
  }
);*/

registerCommand(
  /\/premiuminfo/,
  "Show your premium benefits and expiry",
  async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id.toString();

    const { getUserByTelegramId } = require("./db/userService");
    const user = await getUserByTelegramId(tgId);

    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start.");
    }

    if (
      !user.premium?.isPremium ||
      user.premium.expiresAt <= Date.now()
    ) {
      return bot.sendMessage(
        chatId,
        "💎 You are not a Premium member.\nUse /buypremium <days>."
      );
    }

    const remainingMs = user.premium.expiresAt - Date.now();

    bot.sendMessage(
      chatId,
      `💎 <b>Premium Info</b>\n\n` +
        `⏳ Remaining: ${formatRemainingTime(remainingMs)}`,
      { parse_mode: "HTML" }
    );
  }
);



registerCommand(
  /\/update$/,
  "Pull latest bot updates from GitHub",
  (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "⏳ Pulling latest updates...");

    exec("git pull", (error, stdout, stderr) => {
      if (error) {
        console.error(`Update error: ${error.message}`);
        return bot.sendMessage(chatId, "❌ Update failed. Check server logs.");
      }
      if (stderr) {
        console.error(`Update stderr: ${stderr}`);
      }

      bot.sendMessage(chatId, "✅ Pulled the latest update successfully.\nRestarting might be required.");
    });
  }
);
const cooldowns = {}; // { userId: timestamp }
function cooldownNotExpired(userId, seconds = 15) {
  const now = Date.now();

  if (!cooldowns[userId]) {
    cooldowns[userId] = now;
    return false;
  }

  if (now - cooldowns[userId] < seconds * 1000) {
    return true;
  }

  cooldowns[userId] = now;
  return false;
}

bot.onText(/^\/nanoai(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tgId = msg.from.id.toString();

  const { getUserByTelegramId } = require("./db/userService");
  const user = await getUserByTelegramId(tgId);
  if (!user) return;

  const isPremiumUser =
    user.premium?.isPremium && user.premium.expiresAt > Date.now();

  if (!isPremiumUser && cooldownNotExpired(tgId, 15)) {
    return bot.sendMessage(
      chatId,
      "⏳ Free users can use this every 15 seconds.\n💎 Premium = no cooldown."
    );
  }

  const text = match[1];
  if (!text) {
    return bot.sendMessage(
      chatId,
      "my name is TrustBit coding bot. I am a helpful programming assistant created by my lovely owner Mr Trust and Lord samuel. I love solving coding problems and chatting like   a human. I am also here to help u code 📌 Example:\n/nanoai What is a function in Python?"
    );
  }

  try {
    const res = await fetch(
      `https://api-rebix.vercel.app/api/gptlogic?q=${encodeURIComponent(text)}`
    );
    const data = await res.json();

    const chunks = splitMessage(data.response || "⚠️ No response.");
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk);
    }
  } catch (err) {
    bot.sendMessage(chatId, "❌ AI error.");
  }
});



// ==================== /mystats ====================

// ===== /mystats command =====
registerCommand(
  /\/mystats/,
  "Show your profile stats",
  async (msg) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id.toString();

    const { getUserRankByCoins } = require("./db/LeaderboardService");

    const { getUserByTelegramId} =
      require("./db/userService");

    const user = await getUserByTelegramId(tgId);
    if (!user) {
      return bot.sendMessage(
        chatId,
        "❌ You are not registered yet. Use /start."
      );
    }

    // 🏆 leaderboard rank (Mongo)
    const rank = await getUserRankByCoins(user.coins || 0);

    let tier = "free";
    let tierIcon = "🆓";
    let premiumText = "❌ Not Premium";
    let nameDisplay = user.displayName || user.name || "Unknown";

    if (
      user.premium?.isPremium &&
      user.premium.expiresAt > Date.now()
    ) {
      const ms = user.premium.expiresAt - Date.now();
      const days = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);

      if (days >= 30) {
        tier = "legend";
        tierIcon = "👑";
      } else if (days >= 15) {
        tier = "vip";
        tierIcon = "💎";
      } else if (days >= 8) {
        tier = "pro";
        tierIcon = "🔥";
      } else {
        tier = "premium";
        tierIcon = "🌟";
      }

      premiumText = `${tierIcon} Premium (${days}d ${hours}h ${minutes}m ${seconds}s)`;
      nameDisplay = "💎 " + nameDisplay;
    }

    const badgeList =
      user.badges?.length > 0 ? user.badges.join(" ") : "None";

    const infoMsg = `
<b>📜 Your Info</b>
────────────────
👤 Name: <b>${escapeHTML(nameDisplay)}</b>
💬 Username: @${user.username || "No username"}
💰 Coins: <b>${user.coins || 0}</b>
📅 Joined: <b>${user.createdAt?.toDateString() || "Unknown"}</b>
🔥 Daily Streak: <b>${user.usageCount || 0}</b> days
🏆 Leaderboard Rank: <b>#${rank}</b>
${premiumText}
🎖 Badges: ${badgeList}
`;

    bot.sendMessage(chatId, infoMsg, { parse_mode: "HTML" });
  }
);




// ===== /reset command =====
registerCommand(/\/reset/, "Reset your current course progress", async (msg) => {
  const chatId = msg.chat.id;

  if (!userProgress[chatId]) {
    return bot.sendMessage(chatId, "❗ You haven't started any course yet.");
  }

  const topic = userProgress[chatId].topic;

  // Premium restriction
  if (premiumTopics.includes(topic) && !(await requirePremiumMongo(chatId, msg.from.id))) {
    delete userProgress[chatId];
    return;
  }

  if (!lessons[topic] || lessons[topic].length === 0) {
    return bot.sendMessage(chatId, "❌ Course not found or has no lessons.");
  }

  // Reset progress
  userProgress[chatId] = { topic, index: 0 };

  bot.sendMessage(chatId, "🔁 Course reset!");
  bot.sendMessage(chatId, formatLesson(lessons[topic][0]), { parse_mode: "HTML" });
});
bot.onText(/^\/reply\s+(\d+)\s+(.+)/, async (msg, match) => {
  const adminId = msg.from.id.toString();

  if (adminId !== ADMIN_ID.toString()) {
    return bot.sendMessage(msg.chat.id, "🚫 Admin only command.");
  }

  const targetUserId = match[1];
  const replyMessage = match[2];

  try {
    await bot.sendMessage(
      targetUserId,
      `💬 <b>Support Reply</b>\n\n${escapeHTML(replyMessage)}`,
      { parse_mode: "HTML" }
    );

    bot.sendMessage(
      msg.chat.id,
      `✅ Reply sent to user <code>${targetUserId}</code>.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    bot.sendMessage(
      msg.chat.id,
      "❌ Failed to send reply. User may have blocked the bot."
    );
  }
});

bot.onText(/^\/support(?:\s+([\s\S]+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const tgId = msg.from.id.toString();

  const { getUserByTelegramId } = require("./db/userService");
  const user = await getUserByTelegramId(tgId);
  if (!user) return;

  const isPremium =
    user.premium?.isPremium && user.premium.expiresAt > Date.now();

  if (!isPremium) {
    return bot.sendMessage(chatId, "🚫 Premium only feature.");
  }

  const message = match[1];
  if (!message) {
    return bot.sendMessage(
      chatId,
      "❓ Usage:\n/support My bot is broken"
    );
  }

  await bot.sendMessage(
    ADMIN_ID,
`💎 PREMIUM SUPPORT
🆔 User ID: ${tgId}
📩 Message:
${message}`
  );

  bot.sendMessage(chatId, "✅ Support message sent.");
});






// ===== Bookmarks =====
registerCommand(/\/bookmark/, "Bookmark your current lesson", (msg) => {
  const chatId = msg.chat.id;
  const progress = userProgress[chatId];

  if (!progress) {
    return bot.sendMessage(chatId, "❗ You have no active lesson to bookmark.");
  }

  const lessonsForTopic = lessons[progress.topic];
  if (!lessonsForTopic || !lessonsForTopic[progress.index]) {
    return bot.sendMessage(chatId, "❌ Current lesson not found.");
  }

  if (!userBookmarks[chatId]) userBookmarks[chatId] = [];

  const currentLesson = lessonsForTopic[progress.index];
  const bookmarkKey = `${progress.topic}-${progress.index}`;

  if (userBookmarks[chatId].some(b => b.key === bookmarkKey)) {
    return bot.sendMessage(chatId, "ℹ️ This lesson is already bookmarked.");
  }

  userBookmarks[chatId].push({
    key: bookmarkKey,
    lesson: currentLesson.title
  });

  bot.sendMessage(chatId, `✅ Bookmarked lesson: <b>${escapeHTML(currentLesson.title)}</b>`, { parse_mode: "HTML" });
});


registerCommand(/\/bookmarks/, "List all your saved bookmarks", (msg) => {
  const chatId = msg.chat.id;
  const bookmarks = userBookmarks[chatId] || [];

  if (bookmarks.length === 0) {
    return bot.sendMessage(chatId, "❗ You have no bookmarks yet.");
  }

  const list = bookmarks
    .map((b, i) => `${i + 1}. ${escapeHTML(b.lesson)}`)
    .join('\n');

  const message =
`<b>📑 Your Bookmarks</b>
────────────────
${list}

ℹ️ Use /goto <number> to jump back to a lesson (coming soon).`;

  bot.sendMessage(chatId, message, { parse_mode: "HTML" });
});

// ===== /search command =====
registerCommand(/\/search(?:\s+(.+))?/, "Search for lessons by keyword", (msg, match) => {
  const chatId = msg.chat.id;
  const term = match[1] ? match[1].toLowerCase() : null;

  if (!term) {
    return bot.sendMessage(chatId, "❗ Usage: /search <keyword>");
  }

  let results = [];

  Object.entries(lessons).forEach(([topic, lessonArr]) => {
    lessonArr.forEach((lesson, idx) => {
      if (
        lesson.title.toLowerCase().includes(term) ||
        lesson.explanation.toLowerCase().includes(term) ||
        lesson.task.toLowerCase().includes(term)
      ) {
        results.push(
          `- ${escapeHTML(lesson.title)} (<code>/start_${topic}</code> lesson ${idx + 1})`
        );
      }
    });
  });

  if (results.length === 0) {
    return bot.sendMessage(chatId, "❌ No lessons found matching that term.");
  }

  let msgText = `<b>🔎 Search results for:</b> <i>${escapeHTML(term)}</i>\n\n`;
  msgText += results.slice(0, 20).join("\n");

  if (results.length > 20) {
    msgText += `\n\n…and ${results.length - 20} more results. Try a more specific keyword.`;
  }

  bot.sendMessage(chatId, msgText, { parse_mode: "HTML" });
});


// ===== /run js command (simple sandboxed eval) =====
registerCommand(
  /\/run\s+js(?:\s+([\s\S]+))?/,
  "Run JavaScript code",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id.toString();

    const { getUserByTelegramId } = require("./db/userService");
    const user = await getUserByTelegramId(tgId);
    if (!user) return;

    const isPremium =
      user.premium?.isPremium && user.premium.expiresAt > Date.now();

    if (!isPremium) {
      return bot.sendMessage(chatId, "🚫 Premium only feature.");
    }

    const code = match[1];
    if (!code) {
      return bot.sendMessage(chatId, "❗ Usage: /run js <code>");
    }

    try {
      let output = "";
      const originalLog = console.log;
      console.log = (...args) => (output += args.join(" ") + "\n");

      let result = eval(code);
      console.log = originalLog;

      if (result !== undefined) output += result;

      await bot.sendMessage(
        chatId,
        `<pre>${escapeHTML(output || "No output")}</pre>`,
        { parse_mode: "HTML" }
      );
    } catch (e) {
      bot.sendMessage(
        chatId,
        `❌ Error: <b>${escapeHTML(e.message)}</b>`,
        { parse_mode: "HTML" }
      );
    }
  }
);



// ===== /ping command =====
registerCommand(/\/ping$/, "Check if the bot is alive", (msg) => {
  bot.sendMessage(msg.chat.id, "✅ Bot is alive and running!");
});


// ===== /runtime command =====
registerCommand(/\/runtime$/, "Show how long the bot has been running", (msg) => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  bot.sendMessage(
    msg.chat.id,
    `⏱ <b>Bot Uptime:</b> ${hours}h ${minutes}m ${seconds}s`,
    { parse_mode: "HTML" }
  );
});


// ===== /time command =====
registerCommand(/\/time$/, "Show the current server time (UTC)",(msg) => {
  const now = new Date();
  bot.sendMessage(
    msg.chat.id,
    `🕒 <b>Current Server Time:</b> ${now.toUTCString()}`,
    { parse_mode: "HTML" }
  );
});


// ===== /status command =====
registerCommand(/\/status$/, "Show server memory usage", (msg) => {
  const memory = process.memoryUsage();

  const rss = (memory.rss / 1024 / 1024).toFixed(2);
  const heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotal = (memory.heapTotal / 1024 / 1024).toFixed(2);

  const statusMsg = 
`📊 <b>Server Status</b>
────────────────
🧠 RSS: <b>${rss} MB</b>
🔥 Heap Used: <b>${heapUsed} MB</b>
📦 Heap Total: <b>${heapTotal} MB</b>`;

  bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: "HTML" });
});

// ===== Updated Multiplayer Battles & Leaderboard Core =====
const pathBattles = './battles.json';
const pathLeaderboard = './leaderboard.json';

// ensure files exist
if (!fs.existsSync(pathBattles)) fs.writeFileSync(pathBattles, JSON.stringify({ battles: [] }, null, 2));
if (!fs.existsSync(pathLeaderboard)) fs.writeFileSync(pathLeaderboard, JSON.stringify({ scores: {} }, null, 2));

// More coding + trivia problems
const battleProblems = [
  {
    id: "prime-check",
    title: "Prime Number Check",
    difficulty: "easy",
    description: 'Given an integer n, print "YES" if it is prime, otherwise "NO".\nExample input: 7',
    input: "7",
    expected_output: "YES",
    validate: (ans) => ans.toLowerCase().includes("yes")
  },

  {
    id: "fibonacci",
    title: "Nth Fibonacci",
    difficulty: "medium",
    description: "Given n, print the nth Fibonacci number (0-indexed).\nExample: n=7 → 13",
    input: "7",
    expected_output: "13",
    validate: (ans) => (ans.match(/\d+/g) || []).includes("13")
  },

  {
    id: "js-scope",
    title: "JavaScript Scope Quiz",
    difficulty: "medium",
    description: `Predict the output:
\`\`\`js
let a = 10;
{
  let a = 20;
  console.log(a);
}
console.log(a);
\`\`\``,
    input: "",
    expected_output: "20 10",
    validate: (ans) => ans.includes("20") && ans.includes("10")
  },

  {
    id: "python-loop",
    title: "Python Loop Output",
    difficulty: "easy",
    description: `Predict the output:
\`\`\`python
for i in range(3):
    print("*" * i)
\`\`\``,
    input: "",
    expected_output: "* **",
    validate: (ans) => ans.includes("*") && ans.includes("**")
  },

  {
    id: "reverse-words",
    title: "Reverse Words",
    difficulty: "easy",
    description: 'Reverse the order of words.\nExample: "I love coding" → "coding love I"',
    input: "I love coding",
    expected_output: "coding love I",
    validate: (ans) => ans.toLowerCase().includes("coding love i")
  },

  {
    id: "factorial",
    title: "Factorial Calculator",
    difficulty: "easy",
    description: "Read an integer n and print n!.\nExample: 5 → 120",
    input: "5",
    expected_output: "120",
    validate: (ans) => ans.includes("120")
  },

  {
    id: "sql-query",
    title: "SQL Basics",
    difficulty: "medium",
    description: "Write an SQL query to select all users with age > 18 from table `users`.",
    input: "",
    expected_output: "SELECT * FROM users WHERE age > 18;",
    validate: (ans) =>
      ans.toLowerCase().includes("select") &&
      ans.toLowerCase().includes("age > 18")
  },

  {
    id: "trivia-closure",
    title: "JavaScript Closures",
    difficulty: "medium",
    description: "Explain what a closure is in JavaScript.",
    input: "",
    expected_output: "closure explanation",
    validate: (ans) => ans.toLowerCase().includes("scope")
  },

  {
    id: "trivia-bigO",
    title: "Algorithm Complexity",
    difficulty: "easy",
    description: "What is the time complexity of binary search?",
    input: "",
    expected_output: "O(log n)",
    validate: (ans) => ans.toLowerCase().includes("log")
  },

  {
    id: "output-js",
    title: "Predict JS Output",
    difficulty: "easy",
    description: `What will this output?
\`\`\`js
console.log(typeof NaN);
\`\`\``,
    input: "",
    expected_output: "number",
    validate: (ans) => ans.toLowerCase().includes("number")
  },

  {
    id: "output-python",
    title: "Predict Python Output",
    difficulty: "easy",
    description: `What will this print?
\`\`\`python
print("5" * 3)
\`\`\``,
    input: "",
    expected_output: "555",
    validate: (ans) => ans.includes("555")
  },

  {
    id: "anagram",
    title: "Check Anagram",
    difficulty: "easy",
    description: 'Example: "listen silent" → YES',
    input: "listen silent",
    expected_output: "YES",
    validate: (ans) => ans.toLowerCase().includes("yes")
  },

  {
    id: "palindrome",
    title: "Palindrome Checker",
    difficulty: "easy",
    description: 'Example: "racecar" → YES',
    input: "racecar",
    expected_output: "YES",
    validate: (ans) => ans.toLowerCase().includes("yes")
  },

  {
    id: "capitalize",
    title: "Capitalize Words",
    difficulty: "easy",
    description: 'Example: "hello world" → "Hello World"',
    input: "hello world",
    expected_output: "Hello World",
    validate: (ans) => ans.toLowerCase().includes("hello world")
  },

  // 💥 ADVANCED
  {
    id: "array-sum",
    title: "Sum of Array",
    difficulty: "medium",
    description: "Example: [1,2,3,4] → 10",
    input: "[1,2,3,4]",
    expected_output: "10",
    validate: (ans) => ans.includes("10")
  },

  {
    id: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "easy",
    description: "Example: 121 → YES",
    input: "121",
    expected_output: "YES",
    validate: (ans) => ans.toLowerCase().includes("yes")
  },

  {
    id: "string-compression",
    title: "String Compression",
    difficulty: "hard",
    description: 'Example: "aaabb" → "a3b2"',
    input: "aaabb",
    expected_output: "a3b2",
    validate: (ans) => ans.toLowerCase().includes("a3b2")
  },

  {
    id: "matrix-diagonal-sum",
    title: "Matrix Diagonal Sum",
    difficulty: "medium",
    description: "Example: [[1,2],[3,4]] → 5",
    input: "[[1,2],[3,4]]",
    expected_output: "5",
    validate: (ans) => ans.includes("5")
  },

  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "hard",
    description: "Print numbers 1 to n with FizzBuzz rules.",
    input: "15",
    expected_output: "FizzBuzz",
    validate: (ans) => ans.includes("FizzBuzz")
  }
];


// helpers to read/write JSON


function readLeaderboard() {
  try {
    return JSON.parse(fs.readFileSync(pathLeaderboard, 'utf8'));
  } catch (e) {
    return { scores: {} };
  }
}
function writeLeaderboard(data) {
  fs.writeFileSync(pathLeaderboard, JSON.stringify(data, null, 2));
}

// generate room code
/*function genRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}*/

// format battle status
function formatBattleInfo(b) {
  const players = Object.keys(b.players || {})
    .map((id) => b.players[id].name || id)
    .join(', ') || '—';
  return `🏁 Battle ${b.code}\nProblem: ${b.problem.title}\nPlayers (${Object.keys(b.players).length}/10): ${players}\nStatus: ${b.status}\nTime left: ${Math.max(
    0,
    Math.ceil((b.endsAt - Date.now()) / 1000)
  )} seconds`;
}

// calculate remaining time
function bTimeRemaining(battle) {
  return Math.max(0, battle.endsAt - Date.now());
}

// ===== Commands =====

// Create battle room (max 10 players per room)
// Read and write battles JSON
function readBattles() {
  try {
    return JSON.parse(fs.readFileSync('./battles.json'));
  } catch {
    return { battles: [] };
  }
}
function writeBattles(data) {
  fs.writeFileSync('./battles.json', JSON.stringify(data, null, 2));
}

// Generate unique 5-character room code
function genRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Broadcast only newly created battles with no password (adjust if needed)

async function broadcastNewRooms() {
  const data = readBattles();

  const newRooms = data.battles.filter(
    battle => !battle.broadcasted && battle.status === "waiting"
  );

  if (newRooms.length === 0) return;

  const message = newRooms
    .map(room =>
      `🏟 <b>New Battle Room</b>
🆔 Code: <b>${room.code}</b>
👑 Host: ${room.hostName}
📖 Problem: ${room.problem.title}
👥 Players: ${Object.keys(room.players).length}/10
⏱ Ends in: ${Math.ceil((room.endsAt - Date.now()) / 60000)} min`
    )
    .join("\n\n");

  try {
    const User = require("./models/User");

    // 🎯 Fetch active users only (last 7 days)
    const users = await User.find(
      { lastActive: { $gte: Date.now() - 7 * 24 * 60 * 60 * 1000 } },
      { tgId: 1 }
    );

    for (const u of users) {
      if (!u.telegramId) continue;

      bot.sendMessage(
        u.telegramId,
        `📢 <b>New Battle Rooms Open!</b>\n\n${message}`,
        { parse_mode: "HTML" }
      ).catch(() => {}); // ignore blocked users
    }

    // ✅ Mark rooms as broadcasted
    newRooms.forEach(room => {
      room.broadcasted = true;
    });

    writeBattles(data);

  } catch (err) {
    console.error("❌ Broadcast failed:", err);
  }
}


// /battle start command
registerCommand(
  /\/battle create(?:\s+(\S+))?$/,
  "/battle create Start a new battle",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id.toString();
    const username = msg.from.username || msg.from.first_name || "Unknown";
    const password = match[1] || "";

    const data = readBattles();

    const { getUserByTelegramId } =
      require("./db/userService");
      const { updateUserCoins } = require("./db/userService");


    const user = await getUserByTelegramId(tgId);
    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start.");
    }

    // 🔒 Prevent duplicate waiting battles
    const existing = data.battles.find(
      b => b.host === tgId && b.status === "waiting"
    );

    if (existing) {
      return bot.sendMessage(
        chatId,
        `⚠️ You already have a waiting battle.\nRoom Code: <b>${existing.code}</b>`,
        { parse_mode: "HTML" }
      );
    }

    // 💰 Entry fee (Mongo)
    const entryFee = 50;
    if ((user.coins || 0) < entryFee) {
      return bot.sendMessage(chatId, "🚫 Not enough coins to create this battle.");
    }

    await updateUserCoins(tgId, -entryFee);

    // 🎯 Random problem
    const problem =
      battleProblems[Math.floor(Math.random() * battleProblems.length)];

    // ⏱ Premium duration
    const isPremium =
      user.premium?.isPremium && user.premium.expiresAt > Date.now();

    const durationMinutes = isPremium ? 10 : 5;
    const durationMs = durationMinutes * 60 * 1000;

    const code = genRoomCode();

    const battle = {
      code,
      host: tgId,
      hostName: username,
      password,

      tier: isPremium ? "premium" : "free",
      mode: "classic",

      problem,
      createdAt: Date.now(),
      endsAt: Date.now() + durationMs,

      status: "waiting",

      players: {
        [tgId]: {
          tgId,
          internalId: user._id.toString(),
          name: username,
          joinedAt: Date.now(),
          submitted: false,
          solved: false,
          time: null
        }
      },

      submissions: [],
      broadcasted: false
    };

    data.battles.push(battle);
    writeBattles(data);

    bot.sendMessage(
      chatId,
      `🎯 <b>Battle Created!</b>

🆔 Code: <b>${code}</b>
${password ? "🔒 Password Protected" : "🔓 Open Room"}
🏷 Tier: <b>${battle.tier.toUpperCase()}</b>
📖 Problem: <b>${problem.title}</b>
⏱ Duration: ${durationMinutes} minutes

👥 Join with:
<code>/battle join ${code}${password ? " " + password : ""}</code>`,
      { parse_mode: "HTML" }
    );

    broadcastNewRooms();
  }
);




registerCommand(
  /^\/help$/,
  "Show all available commands",
  (msg) => {
    try {
      const chatId = msg.chat.id;

      const helpText = commands
        .map(cmd => {
          const match = cmd.regex?.toString().match(/\/\w+/);
          if (!match) return null;

          return `- <code>${escapeHTML(match[0])}</code> → ${escapeHTML(cmd.description)}`;
        })
        .filter(Boolean)
        .join("\n");

      bot.sendMessage(
        chatId,
        `<b>📖 Available Commands</b>\n\n${helpText}`,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error("Help command error:", err);
      bot.sendMessage(msg.chat.id, "⚠️ Unable to load help right now.");
    }
  }
);





// ===== Battle Join (Pro version) =====
registerCommand(
  /\/battle join (\S+)(?:\s+(\S+))?$/,
  "/battle join <room> Join a battle room",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const tgId = msg.from.id.toString();
    const username = msg.from.username || msg.from.first_name || "Unknown";

    const code = match[1];
    const passwordAttempt = match[2] || "";

    const data = readBattles();
    //const battle = data.battles.find(b => b.code === code);
    const Battle = require("./models/Battle");

const battle = await Battle.findOne({ code });


    if (!battle) {
      return bot.sendMessage(chatId, `❌ Room code <b>${code}</b> not found.`, { parse_mode: "HTML" });
    }

    if (battle.status !== "waiting") {
      return bot.sendMessage(chatId, `⚠️ Room <b>${code}</b> has already started or finished.`, { parse_mode: "HTML" });
    }

    if (battle.password && battle.password !== passwordAttempt) {
      return bot.sendMessage(chatId, `🔒 Incorrect password for room <b>${code}</b>.`, { parse_mode: "HTML" });
    }

    if (Object.keys(battle.players).length >= 10) {
      return bot.sendMessage(chatId, `❌ Room <b>${code}</b> is full (max 10 players).`, { parse_mode: "HTML" });
    }

    if (battle.players[tgId]) {
      return bot.sendMessage(chatId, `❌ You already joined room <b>${code}</b>.`, { parse_mode: "HTML" });
    }

    // 🔍 Mongo user lookup
    const { getUserByTelegramId } = require("./db/userService");
    const user = await getUserByTelegramId(tgId);

    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start first.");
    }

    const badge =
      user.premium?.isPremium && user.premium.expiresAt > Date.now()
        ? "💎 "
        : "";

    // ➕ Add player
   battle.players.set(tgId, {
  tgId,
  internalId: user._id,
  name: username,
  badge,
  joinedAt: Date.now(),
  submitted: false,
  solved: false,
  time: null
});

await battle.save();


    // ✅ Confirm join
    bot.sendMessage(
      chatId,
      `✅ You joined the battle room <b>${code}</b>! ${badge}`,
      { parse_mode: "HTML" }
    );

    // 📣 Notify host
    if (battle.host !== tgId) {
      bot.sendMessage(
        battle.host,
        `👤 ${badge}${username} joined your battle <b>${code}</b>.`,
        { parse_mode: "HTML" }
      );
    }

    // 📣 Notify others
    Object.keys(battle.players).forEach(pid => {
      if (pid !== tgId && pid !== battle.host) {
        bot.sendMessage(
          pid,
          `👤 ${badge}${username} joined your battle <b>${code}</b>.`,
          { parse_mode: "HTML" }
        );
      }
    });
  }
);




const PREMIUM_GROUP_ID = -1002984807954;
const PREMIUM_GROUP_LINK = "https://t.me/TrustBitCoding"; // generated invite link



async function buyPremium(bot, tgId, days) {
  const User = require("./models/User");

  const user = await User.findOne({ tgId: tgId });
  if (!user) return;

  const cost = 100 * days;
  if (user.coins < cost) {
    return bot.sendMessage(tgId, "❌ Not enough coins.");
  }

  user.coins -= cost;
  user.premium = {
    isPremium: true,
    expiresAt: Date.now() + days * 24 * 60 * 60 * 1000
  };

  await user.save();

  bot.sendMessage(tgId, `🎉 Premium activated for ${days} days!`);
  bot.sendMessage(tgId, `🔗 Join the Premium Group: ${PREMIUM_GROUP_LINK}`);

  sendPremiumWelcome(bot, tgId, user.displayName);
}


// Start periodic premium expiry checks every 10 minutes
setInterval(() => checkPremiumExpiry(bot), 60 * 60 * 1000);
 // every 10 minutes

const quizTask = require("./quiz_and_task");



// Task
registerCommand(/\/task$/, "Get your daily coding task", (msg) => {
  const chatId = msg.chat.id;

  try {
    quizTask.sendDailyTask(bot, chatId);
    bot.sendMessage(chatId, "📬 Daily task sent! Check the message above.");
  } catch (err) {
    console.error("Daily task error:", err);
    bot.sendMessage(chatId, "❌ Unable to fetch your daily task. Please try again later.");
  }
});



// Leaderboard
registerCommand(/\/topquiz$/, "Show the top quiz leaderboard", (msg) => {
  const chatId = msg.chat.id;

  try {
    quizTask.showTopScores(bot, chatId);
  } catch (err) {
    console.error("Error showing top quiz scores:", err);
    bot.sendMessage(chatId, "❌ Could not load the top quiz scores. Please try again later.");
  }
});


// Shop
registerCommand(/\/shop$/, "Open the coin shop", (msg) => {
  const chatId = msg.chat.id;

  try {
    quizTask.showCoinShop(bot, chatId);
  } catch (err) {
    console.error("Error opening shop:", err);
    bot.sendMessage(chatId, "❌ Could not open the shop right now. Please try again later.");
  }
});

registerCommand(/\/buy(?:\s+(.+))?$/, "Buy an item from the shop. Example: /buy coins", (msg, match) => {
  const chatId = msg.chat.id;
  const itemName = match[1];

  if (!itemName) {
    return bot.sendMessage(chatId, "❌ Please specify what you want to buy. Example: /buy sword");
  }

  try {
    quizTask.handlePurchase(bot, chatId, itemName);
  } catch (err) {
    console.error("Error handling purchase:", err);
    bot.sendMessage(chatId, "❌ Could not process your purchase. Please try again later.");
  }
});


// Buy premium


// User wants to buy coins
registerCommand(/\/buycoins(?:\s+(\d+))?$/, "Buy coins (Example: /buycoins 100)", (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseInt(match[1]);

  if (!amount || isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId, "⚠️ Please enter a valid amount. Example: /buycoins 100");
  }

  bot.sendMessage(
    chatId,
    `💰 You want to buy <b>${amount}</b> coins.\n\n` +
    `📩 Please send payment to @KallmeTrust or contact the admin.\n` +
    `✅ Once payment is confirmed, you will receive your coins.`,
    { parse_mode: "HTML" }
  );
});




function getBotUserId(telegramId) {
  return users[telegramId]?.id || null;
}

registerCommand(/\/myid$/, "Show your bot ID", async (msg) => {
  const chatId = msg.chat.id;
  const tgId = msg.from.id.toString();
  const { getUserByTelegramId } = require("./db/userService");

  const user = await getUserByTelegramId(tgId);
  if (!user) {
    return bot.sendMessage(chatId, "❌ You are not registered.");
  }

  bot.sendMessage(
    chatId,
    `🆔 Your bot ID is: <b>${user.id}</b>`,
    { parse_mode: "HTML" }
  );
});

function isAdmin(id) {
  return ADMIN_IDS.has(String(id)) || ADMIN_IDS.has(Number(id));
}


// ===== ADMIN GIVE COINS (UNLIMITED + INBOX) =====

registerCommand(
  /^\/admincoins\s+(\w+)\s+(\d+)$/i,
  "Give coins to a user (admin only)",
  async (msg, match) => {
    try {
      const adminIds = ["6499793556"];
      if (!adminIds.includes(msg.from.id.toString())) {
        return bot.sendMessage(msg.chat.id, "🚫 Admin only.");
      }

      const tgId = match[1];              // telegram ID or internal ID
      const amount = parseInt(match[2], 10);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(msg.chat.id, "❌ Invalid amount.");
      }

      const User = require("./models/User");

      // ✅ Fetch user from Mongo
      const user = await User.findOne({
        $or: [{ tgId }, { id: tgId }]
      });

      if (!user) {
        return bot.sendMessage(msg.chat.id, "❌ User not found.");
      }

      // ✅ Safe defaults
      if (!user.inbox) user.inbox = [];

      // ✅ Update values
      user.coins += amount;

      user.inbox.push({
        title: "🎁 Coins Reward",
        message: `You received 💰 ${amount} coins.\nNew balance: ${user.coins}`,
        read: false,
        createdAt: new Date()
      });

      await user.save();

      bot.sendMessage(
        msg.chat.id,
        `✅ ${amount} coins added to ${user.username || user.tgId}\n💰 Balance: ${user.coins}`
      );
    } catch (err) {
      console.error("admincoins error:", err);
      bot.sendMessage(msg.chat.id, "⚠️ Failed to give coins.");
    }
  }
);




// ===== GIFT COINS (Admin only) =====
registerCommand(
  /^\/giftcoin\s+(\w+)\s+(\d+)$/,
  "Gift coins to a user (admin only)",
  async (msg, match) => {

    const adminIds = ["6499793556"];
    if (!adminIds.includes(msg.from.id.toString())) {
      return bot.sendMessage(msg.chat.id, "🚫 Admin only.");
    }

    const internalId = match[1];
    const amount = parseInt(match[2], 10);

    if (amount <= 0) {
      return bot.sendMessage(msg.chat.id, "⚠️ Invalid amount.");
    }

    const User = require("./models/User");
    const user = await User.findOne({ id: internalId });

    if (!user) {
      return bot.sendMessage(msg.chat.id, "❌ User not found.");
    }

    user.coins += amount;
    user.inbox.push({
      from: "admin",
      subject: "🎁 Gift Coins",
      body: `You received ${amount} coins.`,
      at: Date.now()
    });

    await user.save();

    bot.sendMessage(
      msg.chat.id,
      `✅ Gifted ${amount} coins.\n💰 New balance: ${user.coins}`
    );
  }
);


// ===== BUY PREMIUM =====
const premiumGroupLink = "https://t.me/TrustBitCoding"; // Set your group invite link
const premiumCostPerDay = 50; // Example: 50 coins per day
registerCommand(
  /\/buypremium\s+(\d+)$/,
  "Buy premium for given days",
  async (msg, match) => {

    const chatId = msg.chat.id;
    const days = parseInt(match[1], 10);
    const tgId = msg.from.id.toString();
    const { getUserByTelegramId } = require("./db/userService");

    if (!days || days <= 0) {
      return bot.sendMessage(chatId, "❌ Invalid days.");
    }

    const user = await getUserByTelegramId(tgId);
    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered.");
    }

    const costPerDay = 50;
    const totalCost = days * costPerDay;

    if (user.coins < totalCost) {
      return bot.sendMessage(
        chatId,
        `❌ Not enough coins. Need ${totalCost}.`
      );
    }

    user.coins -= totalCost;

    const now = Date.now();
    user.premium = {
      isPremium: true,
      expiresAt: now + days * 24 * 60 * 60 * 1000
    };

    await user.save();

    bot.sendMessage(
      chatId,
      `🎉 Premium activated for ${days} days!\n🔗 ${premiumGroupLink}`
    );
  }
);

/*registerCommand(
  /\/buypremium\s+(\d+)$/,
  "Buy premium for given days",
  (msg, match) => {
    const chatId = msg.chat.id;
    const days = parseInt(match[1], 10);
    const userId = msg.from.id.toString();
    const { getUserByInternalId } = require("./db/userService");

const user = await getUserByInternalId(userId);


    if (!days || days <= 0) {
      return bot.sendMessage(
        chatId,
        "❌ Please enter a valid number of days. Example: /buypremium 7"
      );
    }

    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered.");
    }

    const totalCost = days * premiumCostPerDay;

    if ((user.coins || 0) < totalCost) {
      return bot.sendMessage(
        chatId,
        `❌ Not enough coins. You need ${totalCost} coins.`
      );
    }

    // Deduct coins
    user.coins -= totalCost;

    // Set premium
    const now = Date.now();
    const expireTime = now + days * 24 * 60 * 60 * 1000;

    /*user.premium = {
      isPremium: true,
      expiresAt: expireTime,
    };*/
/*user.premium = {
  isPremium: true,
  expiresAt: expireTime
};




    saveUsers();

    bot.sendMessage(
      chatId,
      `✅ You are now PREMIUM for ${days} days!\n\n` +
        `💎 Premium expires on: <b>${new Date(expireTime).toDateString()}</b>\n` +
        `🔗 <a href="${premiumGroupLink}">Join Premium Group</a>\n\n` +
        `✨ Premium Benefits:\n` +
        `✅ Unlimited AI requests\n` +
        `✅ Access to coding tutor PRO lessons\n` +
        `✅ Early access to new features\n` +
        `✅ 24/7 priority support\n` +
        `✅ No cooldown on commands`,
      { parse_mode: "HTML", disable_web_page_preview: true }
    );
  }
);*/



registerCommand(
  /^\/premiumstatus$/,
  "Check your premium subscription status",
  async (msg) => {
    const chatId = msg.chat.id;
    const { getUserByTelegramId } = require("./db/userService");

    const user = await getUserByTelegramId(msg.from.id.toString());

    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start first.");
    }

    if (!user.premium?.isPremium) {
      return bot.sendMessage(
        chatId,
        "⚠️ You don't have an active Premium subscription.\n\nUse /buypremium <days> to upgrade."
      );
    }

    const now = Date.now();

    // ⛔ expired → update Mongo
    if (now > user.premium.expiresAt) {
      user.premium.isPremium = false;
      user.premium.expiresAt = null;
      await user.save();

      return bot.sendMessage(
        chatId,
        "⏳ Your Premium subscription has expired.\n\nUse /buypremium <days> to renew."
      );
    }

    const remainingDays = Math.ceil(
      (user.premium.expiresAt - now) / (24 * 60 * 60 * 1000)
    );

    bot.sendMessage(
      chatId,
      `✨ <b>Premium Status</b>\n\n` +
      `✅ Active: <b>Yes</b>\n` +
      `📅 Expires on: <b>${new Date(user.premium.expiresAt).toDateString()}</b>\n` +
      `⏳ Days remaining: <b>${remainingDays}</b>`,
      { parse_mode: "HTML" }
    );
  }
);




// ===== DAILY PREMIUM CHECK =====
//const User = require("./models/User");

setInterval(async () => {
  const now = Date.now();

  const expiredUsers = await User.find({
    "premium.isPremium": true,
    "premium.expiresAt": { $lt: now }
  });

  for (const user of expiredUsers) {
    user.premium.isPremium = false;
    user.premium.expiresAt = null;
    user.badge = null;

    await user.save();

    // OPTIONAL: remove from premium group
    if (user.telegramId) {
      bot.kickChatMember(
        "-100YOUR_GROUP_ID",
        user.telegramId
      ).catch(() => {});
    }
  }
}, 60 * 60 * 1000); // hourly
// Runs every 1 hour



// Check premium expiry every hour
setInterval(() => quizTask.checkPremiumExpiry(bot), 60 * 60 * 1000);



// ===== Battle Start Game (Pro Version) =====
registerCommand(
  /^\/battle startgame(?: (\w{5,6}))?$/i,
  "/battle startgame Start a battle game with the provided room code",
  (msg, match) => {
    const chatId = msg.chat.id;
    const code = match[1] ? match[1].trim().toUpperCase() : null;

    if (!code) {
      return bot.sendMessage(
        chatId,
        '⚠️ Please provide the 6-letter Battle Room Code.\nUsage: /battle startgame ROOMCODE'
      );
    }

    const data = readBattles();
    if (!data || !Array.isArray(data.battles)) {
      return bot.sendMessage(chatId, '❌ Error loading battles.');
    }
    if (battle.currentIndex >= battle.questions.length) {
  endMultiBattle(battle, chatId);
  writeBattles(data);
  return;
}

    const battle = data.battles.find(b => String(b.code).trim().toUpperCase() === code);
    if (!battle) return bot.sendMessage(chatId, '❌ Battle not found.');

    if (battle.status === 'running') return bot.sendMessage(chatId, '⚠️ Battle already running.');
    if (battle.status === 'finished') return bot.sendMessage(chatId, '⚠️ Battle already finished.');
    if (Object.keys(battle.players).length < 2) return bot.sendMessage(chatId, '❌ Need at least 2 players to start.');

    // Start the battle
    battle.status = 'running';
    const now = Date.now();
    battle.endsAt = now + (battle.durationMs || 10 * 60 * 1000);

    writeBattles(data);

    // Notify each player privately with badges
    Object.values(battle.players).forEach(p => {
      const user = users[p.id];
      const badge = (user?.premium?.isPremium && user.premium.expiresAt > Date.now()) ? '💎 ' : '';
      bot.sendMessage(
        p.id,
        `🏁 <b>Battle Started!</b>\n` +
        `🔑 Room: <b>${code}</b>\n` +
        `📌 Problem: <b>${battle.problem.title}</b>\n\n` +
        `${battle.problem.description}\n\n` +
        `➡️ Submit your answer with:\n<code>/battle submit ${code} &lt;your-output&gt;</code>\n\n` +
        `⏳ Time remaining: <b>${Math.ceil((battle.endsAt - now) / 1000)} seconds</b>\n` +
        `✨ Badge: ${badge || 'None'}`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    });

    // Announce in group
    bot.sendMessage(
      chatId,
      `🏁 <b>Battle Started!</b>\n` +
      `🔑 Room: <b>${code}</b>\n` +
      `📌 Problem: <b>${battle.problem.title}</b>\n\n` +
      `👥 Players: ${Object.values(battle.players).map(p => {
        const user = users[p.id];
        const badge = (user?.premium?.isPremium && user.premium.expiresAt > Date.now()) ? '💎 ' : '';
        return `${badge}${p.name}`;
      }).join(', ')}\n\n` +
      `🔥 Good luck to all players!`,
      { parse_mode: 'HTML' }
    );

    // Schedule end of battle
    setTimeout(() => {
      const d = readBattles();
      const b = d.battles.find(x => String(x.code).trim().toUpperCase() === code);
      if (!b || b.status === 'finished') return;

      b.status = 'finished';

      const leaderboard = readLeaderboard();
      Object.values(b.players).forEach(p => {
        if (p.solved) leaderboard.scores[p.id] = (leaderboard.scores[p.id] || 0) + 10;
      });

      writeLeaderboard(leaderboard);
      writeBattles(d);

      // Announce results
      bot.sendMessage(
        chatId,
        `⏹️ <b>Battle ${code} Ended!</b>\n\n` +
        Object.values(b.players)
          .map(p => {
            const user = users[p.id];
            const badge = (user?.premium?.isPremium && user.premium.expiresAt > Date.now()) ? '💎 ' : '';
            return `👤 ${badge}${p.name} — ${p.solved ? '✅ Solved' : '❌ Not solved'}`;
          })
          .join('\n'),
        { parse_mode: 'HTML' }
      );
    }, battle.endsAt - now);
  }
);





// ===== Battle Settings Command (Admin only) =====
registerCommand(
  /^\/battle setsettings (\w{5,6}) (\d+)(?:m|M|min|MIN)? (\d+)(?:q|Q)?(?: (\d+)(?:s|S|sec|SEC)?)?$/,
  "/battle setsettings Set battle settings (admin only): duration, question count, per-question time",
  (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!match) {
      return bot.sendMessage(
        chatId,
        `⚙️ <b>Usage:</b>\n` +
        `<code>/battle setsettings CODE DURATIONmin QUESTIONS [SECONDS]</code>\n\n` +
        `Example:\n<code>/battle setsettings ABC123 5m 10q 30s</code>`,
        { parse_mode: "HTML" }
      );
    }

    const code = match[1].toUpperCase();
    const durationMinutes = parseInt(match[2]);
    const questionCount = parseInt(match[3]);
    const perQuestionSeconds = match[4] ? parseInt(match[4]) : null;

    const data = readBattles();
    const battle = data.battles.find(b => b.code === code);

    if (!battle) return bot.sendMessage(chatId, "❌ Battle not found.");
    if (battle.host !== userId && !ADMIN.includes(userId.toString())) {
      return bot.sendMessage(chatId, "🚫 Only the battle host or admin can change settings.");
    }
    if (battle.status !== "waiting") return bot.sendMessage(chatId, "⚠️ Cannot change settings after the battle has started.");

    // Validate inputs
    if (durationMinutes <= 0 || questionCount <= 0) {
      return bot.sendMessage(chatId, "❌ Duration and question count must be positive numbers.");
    }
    if (perQuestionSeconds !== null && perQuestionSeconds <= 0) {
      return bot.sendMessage(chatId, "❌ Per-question time must be a positive number.");
    }

    // Save settings
    battle.durationMs = durationMinutes * 60 * 1000;
    battle.questionCount = questionCount;
    if (perQuestionSeconds !== null) battle.perQuestionTimeSec = perQuestionSeconds;

    writeBattles(data);

    bot.sendMessage(
      chatId,
      `✅ <b>Battle ${code} settings updated!</b>\n\n` +
      `🕒 Duration: <b>${durationMinutes} minute(s)</b>\n` +
      `❓ Number of Questions: <b>${questionCount}</b>\n` +
      (perQuestionSeconds ? `⏳ Per Question Time: <b>${perQuestionSeconds} seconds</b>` : ""),
      { parse_mode: "HTML" }
    );
  }
);





function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumbers(text) {
  return text.match(/-?\d+(\.\d+)?/g) || [];
}

registerCommand(
  /\/battle submit (\w{5}) (.+)/,
  "/battle submit Submit your answer for the current battle question",
  (msg, match) => {
    const chatId = msg.chat.id;
    const code = match[1].toUpperCase();
    const outputRaw = match[2].trim();
    const uid = msg.from.id.toString();

    try {
      const data = readBattles();
      const battle = data.battles.find(b => b.code === code);
      if (!battle) return bot.sendMessage(chatId, "❌ Battle not found.");
      if (battle.status !== "running") return bot.sendMessage(chatId, "⚠️ Battle is not running.");
      if (!battle.players[uid]) return bot.sendMessage(chatId, "🚫 You are not in this battle.");

      const question = battle.questions[battle.currentQuestionIndex];
      if (!question) return bot.sendMessage(chatId, "⚠️ No active question.");

      const expected = normalize(question.expected_output);
      const output = normalize(outputRaw);

      let correct = false;

      // Auto-detect answer type
      if (["yes","no"].includes(expected)) correct = output.includes(expected);
      else if (!isNaN(expected)) {
        const nums = extractNumbers(output);
        correct = nums.includes(expected);
      } else correct = output.includes(expected);

      if (correct) {
        if (!battle.players[uid].solved[question.id]) {
          battle.players[uid].solved[question.id] = true;
          battle.players[uid].submitted[question.id] = output;

          // 🎯 points
          const leaderboard = readLeaderboard();
          leaderboard.scores[uid] = (leaderboard.scores[uid] || 0) + 10;

          // Team scoring
          if (battle.teams) {
            if (battle.teams.red.includes(uid)) battle.teamScores.red += 10;
            if (battle.teams.blue.includes(uid)) battle.teamScores.blue += 10;
          }

          battle.submissions.push({ user: uid, question: question.id, ok: true });
          writeLeaderboard(leaderboard);
          writeBattles(data);

          bot.sendMessage(
            chatId,
            `✅ Correct!\n${msg.from.username || msg.from.first_name} solved "${question.title}". +10 points!`,
            { parse_mode: "HTML" }
          );

          // Auto-advance question if all players solved it
          const allSolved = Object.values(battle.players).every(p => p.solved[question.id]);
          if (allSolved) {
            battle.currentQuestionIndex++;
            writeBattles(data);

            if (battle.currentQuestionIndex >= battle.questions.length) {
              battle.status = "finished";
              writeBattles(data);
              return bot.sendMessage(chatId, `🏁 Battle ${code} finished!`);
            }

            const nextQ = battle.questions[battle.currentQuestionIndex];
            return bot.sendMessage(chatId, `➡️ Next Question: <b>${nextQ.title}</b>\n${nextQ.description}`, { parse_mode: "HTML" });
          }
        } else {
          return bot.sendMessage(chatId, "ℹ️ You already solved this question.");
        }
      } else {
        // ❌ wrong
        battle.players[uid].submitted[question.id] = output;
        battle.submissions.push({ user: uid, question: question.id, ok: false });
        writeBattles(data);
        return bot.sendMessage(chatId, "❌ Incorrect answer. Try again!");
      }

    } catch (err) {
      console.error("❌ /battle submit error:", err);
      return bot.sendMessage(chatId, "❌ Internal error. Try again.");
    }
  }
);


function endTeamBattle(battle) {
  const red = battle.teamScores.red || 0;
  const blue = battle.teamScores.blue || 0;

  let result = "🤝 DRAW";
  if (red > blue) result = "🔴 RED WINS!";
  if (blue > red) result = "🔵 BLUE WINS!";

  battle.status = "ended";
  writeBattles(readBattles());

  Object.keys(users).forEach(uid => {
    bot.sendMessage(
      uid,
      `🏁 <b>Team Battle Ended!</b>\n\n${result}\n\n` +
      `🔴 Red: ${red} pts\n🔵 Blue: ${blue} pts`,
      { parse_mode: "HTML" }
    ).catch(() => {});
  });
}


function sendMultiQuestion(battle) {
  const q = battle.questions[battle.currentIndex];

  Object.values(battle.players).forEach(p => {
    bot.sendMessage(
      p.id,
      `🧠 <b>Question ${battle.currentIndex + 1}</b>\n\n` +
      `<b>${q.title}</b>\n${q.description}\n\n` +
      `➡️ <code>/multibattle submit ${battle.code} &lt;answer&gt;</code>`,
      { parse_mode: "HTML" }
    ).catch(()=>{});
  });

  setTimeout(() => advanceMultiBattle(battle.code), battle.perQuestionTimeSec * 1000);
}
function advanceMultiBattle(code) {
  const data = readBattles();
  const b = data.multiBattles.find(x => x.code === code);
  if (!b || b.status !== "running") return;

  b.currentIndex++;

  if (b.currentIndex >= b.questions.length) {
    b.status = "finished";
    announceWinners(b);
  } else {
    b.questionStartedAt = Date.now();
    sendMultiQuestion(b);
  }

  writeBattles(data);
}
function announceWinners(b) {
  const rank = Object.values(b.players)
    .sort((a,b)=>b.score-a.score)
    .map((p,i)=>`${i+1}. ${p.name} — ${p.score} pts`)
    .join("\n");

  Object.values(b.players).forEach(p => {
    bot.sendMessage(p.id, `🏆 <b>MultiBattle Results</b>\n\n${rank}`, {
      parse_mode: "HTML"
    }).catch(()=>{});
  });
}
registerCommand(
  /^\/battle team (red|blue)$/i,
  "/battle team red or blue Join a battle team (red or blue)",
  (msg, match) => {
    const chatId = msg.chat.id;
    const team = match[1].toLowerCase();
    const uid = msg.from.id;

    const data = readBattles();
    const battle = data.battles.find(
      b => b.status === "running" && b.teams
    );

    if (!battle) {
      return bot.sendMessage(chatId, "❌ No active team battle.");
    }

    // ❌ already assigned?
    if (
      battle.teams.red.includes(uid) ||
      battle.teams.blue.includes(uid)
    ) {
      return bot.sendMessage(chatId, "⚠️ You already joined a team.");
    }

    battle.teams[team].push(uid);
    writeBattles(data);

    bot.sendMessage(
      chatId,
      `✅ You joined <b>${team.toUpperCase()}</b> team ${
        team === "red" ? "🔴" : "🔵"
      }`,
      { parse_mode: "HTML" }
    );
  }
);


registerCommand(
  /^\/multibattle create(?: (\d+))?$/,
  "/multibattle create Create a multi-question battle",
  (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const name = msg.from.username || msg.from.first_name;

    const qCount = Math.min(parseInt(match?.[1]) || 5, 10);
    const questions = [...battleProblems]
      .sort(() => Math.random() - 0.5)
      .slice(0, qCount);

    const code = genRoomCode();
    const data = readBattles();
    data.multiBattles ??= [];

    data.multiBattles.push({
      code,
      host: userId,
      status: "waiting",
      questions,
      currentIndex: 0,
      perQuestionTimeSec: 60,
      players: {
        [userId]: {
          id: userId,
          name,
          score: 0,
          answered: {}
        }
      }
    });

    writeBattles(data);

    bot.sendMessage(
      chatId,
      `🔥 <b>MultiBattle Created!</b>\n\n` +
      `🆔 Code: <b>${code}</b>\n` +
      `❓ Questions: ${qCount}\n\n` +
      `➡️ Join with <code>/multibattle join ${code}</code>`,
      { parse_mode: "HTML" }
    );
  }
);

registerCommand(
  /^\/multibattle join (\w{5,6})$/,
  "/multibattle join Join a multibattle room",
  (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const name = msg.from.username || msg.from.first_name;

    const data = readBattles();
    const battle = data.multiBattles?.find(b => b.code === match[1]);

    if (!battle) return bot.sendMessage(chatId, "❌ Room not found.");
    if (battle.status !== "waiting") return bot.sendMessage(chatId, "⚠️ Already started.");

    battle.players[userId] = {
      id: userId,
      name,
      score: 0,
      answered: {}
    };

    writeBattles(data);
    bot.sendMessage(chatId, "✅ Joined MultiBattle!");
  }
);

/*registerCommand(
  /^\/multibattle start (\w{5,6})$/,
  "/multibattle start Start a multibattle",
  (msg, match) => {
    const data = readBattles();
    const battle = data.multiBattles.find(b => b.code === match[1]);

    if (!battle) return bot.sendMessage(msg.chat.id, "❌ Not found.");
    if (msg.from.id !== battle.host)
      return bot.sendMessage(msg.chat.id, "🚫 Host only.");

    battle.status = "running";
    battle.questionStartedAt = Date.now();
    writeBattles(data);

    sendMultiQuestion(battle);
  }
);*/

registerCommand(
  /^\/multibattle start (\w{5})$/i,
  "Start a multibattle",
  (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const code = match[1].toUpperCase();

    const data = readBattles();
    const battle = data.multiBattles?.find(b => b.code === code);

    if (!battle) return bot.sendMessage(chatId, "❌ Multibattle not found.");
    if (battle.host !== userId) return bot.sendMessage(chatId, "🚫 Host only.");
    if (battle.status !== "waiting") return bot.sendMessage(chatId, "⚠️ Already started.");

    battle.status = "running";
    battle.startedAt = Date.now();
    battle.currentIndex = 0;

    writeBattles(data);

    const q = battle.questions[0];

    bot.sendMessage(
      chatId,
      `🚀 <b>MultiBattle Started!</b>\n\n` +
      `❓ <b>Question 1/${battle.questions.length}</b>\n` +
      `📌 <b>${q.title}</b>\n\n${q.description}\n\n` +
      `✍️ Submit with:\n<code>/multibattle submit ${code} your_answer</code>`,
      { parse_mode: "HTML" }
    );
  }
);


registerCommand(
  /^\/multibattle ai (\d+)(?: (\w+))?$/,
  "/multibattle ai <count> [difficulty]",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const count = Math.min(parseInt(match[1], 10) || 1, 10);
    const difficulty = match[2] || "medium";

    const data = readBattles();
    data.multiBattles ??= [];

    // 🚫 Prevent duplicate waiting battles
    const existing = data.multiBattles.find(
      b => b.host === userId && b.status === "waiting"
    );
    if (existing) {
      return bot.sendMessage(
        chatId,
        `⚠️ You already have a waiting multibattle (Code: <b>${existing.code}</b>)`,
        { parse_mode: "HTML" }
      );
    }
    if (battle.currentIndex >= battle.questions.length) {
  endMultiBattle(battle, chatId);
  writeBattles(data);
  return;
}


    bot.sendMessage(chatId, "🤖 Generating AI questions... Please wait ⏳");

    const questions = [];

    for (let i = 0; i < count; i++) {
      try {
        const q = await generateAIQuestion(difficulty);

        // 🛡 Validate AI response
        if (!q || !q.title || !q.expected_output) {
          throw new Error("Invalid AI question");
        }

        questions.push(q);
      } catch (err) {
        console.error("❌ AI Question Error:", err);
        return bot.sendMessage(
          chatId,
          "❌ Failed to generate AI questions. Please try again."
        );
      }
    }

    const code = genRoomCode();

    data.multiBattles.push({
      code,
      host: userId,
      status: "waiting",
      createdAt: Date.now(),
      startedAt: null,

      questions,
      currentIndex: 0,
      perQuestionTimeSec: 60,

      players: {
        [userId]: {
          id: userId,
          name: msg.from.username || msg.from.first_name || "Host",
          score: 0,
          answered: {}
        }
      },

      submissions: []
    });

    writeBattles(data);

    bot.sendMessage(
      chatId,
      `🤖 <b>AI MultiBattle Created!</b>\n\n` +
      `🆔 Code: <b>${code}</b>\n` +
      `🔥 Difficulty: <b>${difficulty}</b>\n` +
      `❓ Questions: <b>${questions.length}</b>\n\n` +
      `👥 Others can join with:\n<code>/multibattle join ${code}</code>`,
      { parse_mode: "HTML" }
    );
  }
);
registerCommand(
  /^\/multibattle next (\w{5})$/i,
  "Move to next multibattle question",
  (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const code = match[1].toUpperCase();

    const data = readBattles();
    const battle = data.multiBattles?.find(b => b.code === code);

    if (!battle) return bot.sendMessage(chatId, "❌ Multibattle not found.");
    if (battle.host !== userId) return bot.sendMessage(chatId, "🚫 Host only.");
    if (battle.status !== "running") return bot.sendMessage(chatId, "⚠️ Battle not running.");

    battle.currentIndex++;

    // 🏁 END BATTLE
    if (battle.currentIndex >= battle.questions.length) {
      battle.status = "finished";

      // 🏆 Update leaderboard
      const leaderboard = readLeaderboard();

      Object.values(battle.players).forEach(p => {
        leaderboard.scores[p.id] =
          (leaderboard.scores[p.id] || 0) + (p.score || 0);
      });

      writeLeaderboard(leaderboard);
      writeBattles(data);

      const results = Object.values(battle.players)
        .sort((a, b) => b.score - a.score)
        .map((p, i) => `${i + 1}. ${p.name} — ${p.score} pts`)
        .join("\n");

      return bot.sendMessage(
        chatId,
        `🏁 <b>MultiBattle Finished!</b>\n\n🏆 <b>Final Scores</b>\n${results}`,
        { parse_mode: "HTML" }
      );
    }

    // ▶️ NEXT QUESTION
    const q = battle.questions[battle.currentIndex];

    writeBattles(data);

    bot.sendMessage(
      chatId,
      `➡️ <b>Next Question (${battle.currentIndex + 1}/${battle.questions.length})</b>\n\n` +
      `📌 <b>${q.title}</b>\n\n${q.description}\n\n` +
      `✍️ Submit with:\n<code>/multibattle submit ${code} your_answer</code>`,
      { parse_mode: "HTML" }
    );
  }
);





registerCommand(
  /\/battle delete (\S+)/,
  "/battle delte Delete a battle room (admin only)",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const roomCode = match[1].toUpperCase();

    const admins = [649979355]; // ✅ Replace with your real Telegram ID(s)

    try {
      if (!admins.includes(userId)) {
        return bot.sendMessage(chatId, "🚫 You do not have permission to delete rooms.");
      }

      const data = readBattles();
      const roomIndex = data.battles.findIndex((b) => b.code === roomCode);

      if (roomIndex === -1) {
        return bot.sendMessage(chatId, `❌ Room <b>${roomCode}</b> not found.`, { parse_mode: "HTML" });
      }

      data.battles.splice(roomIndex, 1);
      writeBattles(data);

      await bot.sendMessage(chatId, `✅ Room <b>${roomCode}</b> has been deleted.`, { parse_mode: "HTML" });
    } catch (error) {
      console.error("Error in /battle delete:", error);
      bot.sendMessage(chatId, "❌ An error occurred while trying to delete the room.");
    }
  }
);

// List all battle rooms with lock/unlock emoji and join info
/*registerCommand(
  /\/battle rooms$/,
  "List all active battle rooms",
  (msg) => {
    const chatId = msg.chat.id;
    const data = readBattles();

    if (!data.battles.length) {
      return bot.sendMessage(chatId, "📭 No active battle rooms right now.");
    }

    const roomsList = data.battles
      .map((room) => {
        const lockEmoji = room.password ? "🔒" : "🔓";
        const playerCount = Object.keys(room.players).length;
        const passwordHint = room.password ? " (password required)" : "";
        return (
          `${lockEmoji} Room: <b>${room.code}</b>\n` +
          `👥 Players: ${playerCount}${passwordHint}\n` +
          `➡️ Join with: <code>/battle join ${room.code}${room.password ? " [password]" : ""}</code>
`
        );
      })
      .join("\n\n");

    bot.sendMessage(
      chatId,
      `<b>🏟 Current Battle Rooms:</b>\n\n${roomsList}`,
      { parse_mode: "HTML" }
    );
  }
);*/

// ===== List Active Battle Rooms =====
registerCommand(
  /\/battle rooms$/,
  "/battle rooms List all active battle rooms",
  (msg) => {
    const chatId = msg.chat.id;
    const data = readBattles();

    if (!data || !Array.isArray(data.battles) || data.battles.length === 0) {
      return bot.sendMessage(chatId, "📭 No active battle rooms right now.");
    }

    const roomsList = data.battles
      .map((room) => {
        const lockEmoji = room.password ? "🔒" : "🔓";
        const playerCount = Object.keys(room.players).length;
        const passwordHint = room.password ? " (password required)" : "";
        const durationMinutes = room.durationMs ? Math.ceil(room.durationMs / 60000) : 5;
        return (
          `${lockEmoji} <b>Room:</b> ${room.code}\n` +
          `👥 Players: ${playerCount} / 10${passwordHint}\n` +
          `⏱ Duration: ${durationMinutes} min\n` +
          `➡️ Join: <code>/battle join ${room.code}${room.password ? " [password]" : ""}</code>`
        );
      })
      .join("\n\n");

    bot.sendMessage(
      chatId,
      `<b>🏟 Active Battle Rooms:</b>\n\n${roomsList}`,
      { parse_mode: "HTML" }
    );
  }
);



// Leave battle
registerCommand(
  /\/battle leave (\S+)/,
  "/battle leave <room code>Leave a battle room",
  (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const code = match[1].toUpperCase();

    const data = readBattles();
    const room = data.battles.find(b => b.code === code);

    if (!room) {
      return bot.sendMessage(chatId, "❌ Room not found.");
    }

    if (!room.players[userId]) {
      return bot.sendMessage(chatId, "⚠️ You are not in this room.");
    }

    // Remove player
    delete room.players[userId];

    // If host left, delete the room
    if (room.host === userId) {
      data.battles = data.battles.filter(b => b.code !== code);
      writeBattles(data);
      return bot.sendMessage(
        chatId,
        `🏁 You left and closed the room <b>${code}</b> (host left).`,
        { parse_mode: "HTML" }
      );
    }

    // Otherwise, save updated room
    writeBattles(data);
    bot.sendMessage(chatId, `✅ You left the room <b>${code}</b>.`, { parse_mode: "HTML" });
  }
);


// Battle status
registerCommand(
  /\/battle status (\w{5,6})/i,
  "/battle status Check the status of a battle",
  (msg, match) => {
    const chatId = msg.chat.id;
    const code = match[1].toUpperCase();

    const data = readBattles();
    const battle = data.battles.find((b) => b.code === code);

    if (!battle) {
      return bot.sendMessage(chatId, "❌ Battle not found.");
    }

    // Calculate time since battle started
    const now = Date.now();
    const startedAgoMs = battle.startedAt ? now - battle.startedAt : 0;
    const startedAgoMin = Math.floor(startedAgoMs / 60000);

    const status = battle.startedAt
      ? (battle.endsAt && now > battle.endsAt ? "🏁 Finished" : "🔥 Ongoing")
      : "⌛ Waiting to start";

    const info = `
🏆 <b>Battle Status</b>
━━━━━━━━━━━━━━
🔑 <b>Code:</b> ${battle.code}
👑 <b>Host:</b> ${battle.admin || "Unknown"}
👥 <b>Players:</b> ${Object.keys(battle.players).length}
❓ <b>Total Questions:</b> ${battle.totalQuestions || "Not set"}
⏱ <b>Time per Question:</b> ${battle.timePerQuestionSec ? battle.timePerQuestionSec + " sec" : "Not set"}
🕒 <b>Total Duration:</b> ${battle.durationMinutes ? battle.durationMinutes + " min" : "Not set"}
📅 <b>Status:</b> ${status}
⏳ <b>Running For:</b> ${startedAgoMin} min
━━━━━━━━━━━━━━
`;

    bot.sendMessage(chatId, info, { parse_mode: "HTML" });
  }
);


// New: Show remaining time in battle
registerCommand(
  /\/battle timeleft (\w{5,6})/,            // regex
  "/battle timeleft Show remaining time in a battle",        // description (string)
  async (msg, match) => {                   // handler (function)
    const chatId = msg.chat.id;
    const code = (match[1] || "").toUpperCase();

  const data = readBattles();
  const battle = (data && data.battles || []).find((b) => String(b.code).trim().toUpperCase() === rawCode.toUpperCase());
  if (!battle) {
    return safeSend(chatId, "❌ Battle not found.");
  }

  if (!battle.startedAt) {
    return safeSend(
      chatId,
      `⌛ Battle <b>${code}</b> has not started yet.`,
      { parse_mode: "HTML" }
    );
  }

  const remainingMs = bTimeRemaining(battle);

  if (remainingMs <= 0) {
    return safeSend(
      chatId,
      `🏁 Battle <b>${code}</b> has already finished.`,
      { parse_mode: "HTML" }
    );
  }

  const remainingSec = Math.ceil(remainingMs / 1000);
  const min = Math.floor(remainingSec / 60);
  const sec = remainingSec % 60;

  await safeSend(
    chatId,
    `⏳ <b>Time left in battle ${code}:</b>\n<b>${min}m ${sec}s</b>`,
    { parse_mode: "HTML" }
  );
});



function getLeaderboardScore(user) {
  const basePoints = user.points || 0;
  const now = Date.now();

  if (!user.premium?.isPremium || user.premium.expiresAt <= now) {
    return basePoints;
  }

  const daysLeft = Math.floor(
    (user.premium.expiresAt - now) / (1000 * 60 * 60 * 24)
  );

  let multiplier = 1;
  if (daysLeft >= 30) multiplier = 1.5;
  else if (daysLeft >= 15) multiplier = 1.3;
  else if (daysLeft >= 8) multiplier = 1.15;
  else multiplier = 1.1;

  return Math.floor(basePoints * multiplier);
}


// ===== Leaderboard =====
registerCommand(
  /\/leaderboard$/,
  "Show the top 30 players leaderboard",
  async (msg) => {
    const chatId = msg.chat.id;
    const User = require("./models/User");

    const users = await User.find({})
      .select("username first_name points premium")
      .lean();

    if (!users.length) {
      return bot.sendMessage(chatId, "🏆 Leaderboard is empty.");
    }

    const sorted = users
      .sort((a, b) => getLeaderboardScore(b) - getLeaderboardScore(a))
      .slice(0, 30);

    const leaderboardText = sorted
      .map((user, index) => {
        const name =
          user.username ? `@${user.username}` :
          user.first_name ? user.first_name :
          `ID:${user._id}`;

        const isPremium =
          user.premium?.isPremium && user.premium.expiresAt > Date.now();

        const badge = isPremium ? "💎 " : "";
        const boosted = getLeaderboardScore(user);
        const base = user.points || 0;

        return `${index + 1}. <b>${badge}${name}</b> — ${boosted} pts${
          boosted !== base ? " <i>(boosted)</i>" : ""
        }`;
      })
      .join("\n");

    bot.sendMessage(
      chatId,
      `<b>🏆 Top 30 Players</b>\n\n${leaderboardText}`,
      { parse_mode: "HTML" }
    );
  }
);





const ADMIN = ['6499793556'];

bot.onText(/\/stats$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (!ADMIN.includes(userId)) {
    return bot.sendMessage(chatId, "❌ Unauthorized.");
  }

  const User = require("./models/User");
  const Battle = require("./models/Battle"); // later, can be stub

  const now = Date.now();

  const totalUsers = await User.countDocuments();
  const onlineUsers = await User.countDocuments({
    lastActive: { $gte: now - 10 * 60 * 1000 }
  });

  const activeRooms = 0; // battles disabled for now

  const topPlayers = await User.find({})
    .sort({ points: -1 })
    .limit(5)
    .select("username first_name points");

  const topText = topPlayers.length
    ? topPlayers.map((u, i) =>
        `${i + 1}. <b>${u.username ? "@" + u.username : u.first_name}</b> — ${u.points || 0} pts`
      ).join("\n")
    : "No players yet.";

  bot.sendMessage(
    chatId,
    `
📊 <b>Bot Stats</b>
━━━━━━━━━━━━━━
👥 Total users: <b>${totalUsers}</b>
🟢 Online users (10m): <b>${onlineUsers}</b>
🎮 Active rooms: <b>${activeRooms}</b>

🏆 <b>Top 5 Players</b>
${topText}
`,
    { parse_mode: "HTML" }
  );
});



function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// /motivate
registerCommand(
  /\/motivate$/,                          // regex
  "Send a random motivational quote",     // description
  async (msg) => {                        // <-- async added
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const { getUserByTelegramId } = require("./db/userService");

    const user = await getUserByTelegramId(userId);
    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start.");
    }

    bot.sendMessage(chatId, getRandomItem(motivationalQuotes));
  }
);



// /funfact
registerCommand(
  /\/funfact$/,                        // regex
  "Send a random fun fact",            // description
 async (msg) => {                           // handler
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const { getUserByTelegramId } = require("./db/userService");

    const user = await getUserByTelegramId(userId);
    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start.");
    }


    bot.sendMessage(chatId, getRandomItem(funFacts));
  }
);


// /roastcode
registerCommand(
  /\/roastcode$/,                     // regex
  "Send a random code roast",         // description
  async (msg) => {                          // handler
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const { getUserByTelegramId } = require("./db/userService");

const user = await getUserByTelegramId(userId);
if (!user) {
  return bot.sendMessage(chatId, "❌ You are not registered. Use /start.");
}


    bot.sendMessage(chatId, getRandomItem(roasts));
  }
);




// Track active users to give easter egg only to active users
const activeUsers = new Set();

bot.on('message', (msg) => {
  activeUsers.add(msg.from.id);
});
const coupons = [
  { type: 'premium', durationDays: 1, description: '1 day premium access' },
  { type: 'premium', durationDays: 2, description: '2 days premium access' },
  { type: 'admin_panel', durationDays: 7, description: '1 week admin panel access' },
  { type: 'admin_panel', durationDays: 0, description: 'Unlimited panel access' },
  { type: 'points', amount: 500, description: '500 free points' }
];

//const awardedCoupons = readJSON('./coupons.json'); // save awarded coupons history
/*registerCommand(
  /\/profile$/,                      // regex
  "Show your profile info",          // description
  (msg) => {                         // handler
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!users[userId]) {
      return bot.sendMessage(
        chatId,
        "❌ You’re not registered yet. Use /start first."
      );
    }

    const u = users[userId];
    const profileText =
      `<b>👤 Your Profile</b>\n` +
      `Name: ${u.name}\n` +
      `Username: @${u.username || "No username"}\n` +
      `ID: ${u.id}\n` +
      `Joined: ${new Date(u.joinDate).toLocaleDateString()}\n` +
      `Coins: ${u.coins || 0}\n` +
      `Usage Count: ${u.usageCount || 0}`;

    bot.sendMessage(chatId, profileText, { parse_mode: "HTML" });
  }
);*/

registerCommand(
  /\/easteregg$/, 
  "easter fun",
  (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (!activeUsers.has(msg.from.id)) {
    return bot.sendMessage(chatId, "Keep interacting with the bot to unlock hidden surprises!");
  }

  // 30% chance to win a coupon
  if (Math.random() > 0.7) {
    const coupon = coupons[Math.floor(Math.random() * coupons.length)];

    // Save coupon awarded
    if (!awardedCoupons[userId]) awardedCoupons[userId] = [];
    awardedCoupons[userId].push({ coupon, awardedAt: Date.now() });
    writeJSON('./coupons.json', awardedCoupons);

    // Send user DM with coupon details
    bot.sendMessage(
      userId,
      `🎉 Congratulations! You won a hidden coupon:\n\n<b>${coupon.description}</b>\n\nPlease DM @YKallmeTrust to claim your reward.`,
      { parse_mode: 'HTML' }
    );

    // Broadcast announcement to all users
    const announcement = `🎉 User @${msg.from.username || msg.from.first_name} just won a hidden coupon: ${coupon.description}! Keep using the bot for a chance to win!`;
    Object.keys(users).forEach(uid => {
      bot.sendMessage(uid, announcement).catch(() => {});
    });

    // Optional email announcement
    sendAnnouncementEmail(announcement);

  } else {
    bot.sendMessage(chatId, "No luck this time, keep trying!");
  }
});

setInterval(() => {
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  Object.entries(users).forEach(([userId, user]) => {
    // Must be premium
    if (!user.premium?.isPremium || user.premium.expiresAt <= now) return;

    const lastBonus = user.lastWeeklyBonus || 0;
    const lastReminder = user.lastWeeklyReminder || 0;

    // Bonus available + reminder not sent yet
    if (
      now - lastBonus >= WEEK &&
      now - lastReminder >= WEEK
    ) {
      addMailToUser(user.tgId, {
  from: "system",
  subject: "🎁 Weekly Bonus Available",
  body: "Your weekly Premium bonus is ready! Use /weeklybonus to claim your coins 💎"
});


      user.lastWeeklyReminder = now;
    }
  });

  saveUsers();
}, 60 * 60 * 1000); // runs every 1 hour (safe)



// List of admin user IDs (your Telegram user IDs)
const adminUserIds = [6499793556];

registerCommand(/\/weeklybonus$/, "Claim weekly premium bonus", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const { getUserByInternalId } = require("./db/userService");

const user = await getUserByInternalId(userId);

  if (!user) {
    return bot.sendMessage(chatId, "❌ You are not registered yet. Use /start.");
  }

  // ✅ Premium check (YOUR CURRENT SYSTEM)
  if (!user.premium?.isPremium || user.premium.expiresAt <= Date.now()) {
    return bot.sendMessage(chatId, "🚫 Premium only feature.");
  }

  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (user.lastWeeklyBonus && now - user.lastWeeklyBonus < WEEK) {
    const remaining = WEEK - (now - user.lastWeeklyBonus);

    const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const h = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const m = Math.floor((remaining / (1000 * 60)) % 60);

    return bot.sendMessage(
      chatId,
      `⏳ Weekly bonus already claimed.\nNext bonus in ${d}d ${h}h ${m}m`
    );
  }

  // 🎁 GIVE BONUS
  const BONUS_COINS = 50;
  user.coins = (user.coins || 0) + BONUS_COINS;
  user.lastWeeklyBonus = now;

  saveUsers();

  // 📬 Inbox mail
  addMailToUser(user.tgId, {
    from: "system",
    subject: "🎁 Weekly Premium Bonus",
    body: `You received ${BONUS_COINS} coins as your weekly Premium bonus 💎`
  });

  bot.sendMessage(
    chatId,
    `🎉 You received *${BONUS_COINS} coins* as your weekly Premium bonus!`,
    { parse_mode: "Markdown" }
  );
});


// Command to send announcement
registerCommand(/\/announce (.+)/,
  "announce to everyone",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id.toString();
    const announcement = match[1].trim();

    if (!ADMIN.includes(adminId)) {
      return bot.sendMessage(chatId, "❌ No permission.");
    }

    const User = require("./db/models/User");

    const users = await User.find({}).select("tgId inbox").lean(false);

    for (const user of users) {
      user.inbox.push({
        title: "📢 Announcement",
        message: announcement
      });

      await user.save();

      bot.sendMessage(
        user.tgId,
        "📬 You have a new announcement.\nUse /inbox to read it."
      ).catch(() => {});
    }

    bot.sendMessage(chatId, "✅ Announcement sent.");
  }
);
registerCommand(
  /\/inbox$/,
  "Show your inbox messages",
  async (msg) => {
    const tgId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const User = require("./db/models/User");

    const user = await User.findOne({ tgId });

    if (!user || !user.inbox.length) {
      return bot.sendMessage(chatId, "📭 Your inbox is empty.");
    }

    const listText = user.inbox
      .map(
        (mail, i) =>
          `${i + 1}. ${mail.read ? "✅" : "📩"} ${mail.title}`
      )
      .join("\n");

    bot.sendMessage(
      chatId,
      `📬 <b>Your Messages:</b>\n\n${listText}\n\nUse /read (number) to read.`,
      { parse_mode: "HTML" }
    );
  }
);



// 📖 Read message command
registerCommand(
  /\/read (\d+)/,
  "Read an inbox message",
  async (msg, match) => {
    const tgId = msg.from.id.toString();
    const index = parseInt(match[1], 10) - 1;
    const chatId = msg.chat.id;

    const User = require("./db/models/User");
    const user = await User.findOne({ tgId });

    if (!user || !user.inbox[index]) {
      return bot.sendMessage(chatId, "❌ Message not found.");
    }

    const mail = user.inbox[index];
    mail.read = true;
    await user.save();

    bot.sendMessage(
      chatId,
      `<b>${mail.title}</b>\n\n${mail.message}`,
      { parse_mode: "HTML" }
    );
  }
);

/*registerCommand(
  /\/read (\d+)/,
  "Read a message from your inbox",
  async (msg, match) => {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const index = parseInt(match[1], 10) - 1;
    const Mail = require("./db/models/Mail");

    const mail = await Mail.find({ tgId: userId })
      .sort({ createdAt: -1 })
      .skip(index)
      .limit(1);

    if (!mail.length) {
      return bot.sendMessage(chatId, "❌ Invalid message number.");
    }

    const message = mail[0];

    // Mark as read
    await Mail.updateOne(
      { _id: message._id },
      { $set: { read: true } }
    );

    bot.sendMessage(
      chatId,
      `📩 <b>${message.subject}</b>
From: ${message.from}
Received: ${new Date(message.createdAt).toLocaleString()}

${message.body}`,
      { parse_mode: "HTML" }
    );
  }
);*/




// 🗑️ Delete a message
registerCommand(
  /\/delete (\d+)/,
  "Delete a message from your inbox",
  async (msg, match) => {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const index = parseInt(match[1], 10) - 1;
    const Mail = require("./db/models/User");

    const mail = await Mail.find({ tgId: userId })
      .sort({ createdAt: -1 })
      .skip(index)
      .limit(1);

    if (!mail.length) {
      return bot.sendMessage(chatId, "❌ Invalid message number.");
    }

    await Mail.deleteOne({ _id: mail[0]._id });

    bot.sendMessage(chatId, "🗑️ Message deleted.");
  }
);


// 🎁 Mystery box
registerCommand(
  /\/mysterybox/,
  "Open your daily mystery box (coins, premium, or badge!)",
  async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const now = Date.now();

    const { getUserByTelegramId } = require("./db/userService");
    const User = require("./db/models/User");

    const user = await getUserByTelegramId(userId);

    if (!user) {
      return bot.sendMessage(chatId, "❌ You are not registered. Use /start first.");
    }

    // ⏳ 24h cooldown check
    if (user.lastMysteryBox && now - user.lastMysteryBox < 24 * 60 * 60 * 1000) {
      return bot.sendMessage(
        chatId,
        "📦 You already opened your mystery box today. Come back tomorrow!"
      );
    }

    const isPremium =
      user.premium?.isPremium && user.premium.expiresAt > now;

    const chance = Math.random();
    let rewardText = {};
    let message = "";

    // 🎁 PREMIUM REWARD
    if (chance < (isPremium ? 0.05 : 0.01)) {
      const ONE_DAY = 24 * 60 * 60 * 1000;

      const newExpiry =
        user.premium?.expiresAt && user.premium.expiresAt > now
          ? user.premium.expiresAt + ONE_DAY
          : now + ONE_DAY;

      rewardText = {
        "premium.isPremium": true,
        "premium.expiresAt": newExpiry
      };

      message = "🎁 You won +1 day Premium! 💎";

    // 💰 COINS REWARD
    } else if (chance < (isPremium ? 0.20 : 0.10)) {
      const coins = Math.floor(Math.random() * 90) + 10;

      rewardText = {
        $inc: { coins }
      };

      message = `💰 You found ${coins} coins!`;

    // 🏅 BADGE REWARD
    } else {
      rewardText = {
        badge: "🏅",
        badgeExpiresAt: now + 24 * 60 * 60 * 1000
      };

      message = "🏅 You got a 24h special badge!";
    }

    // ✅ ATOMIC UPDATE (VERY IMPORTANT)
    await User.updateOne(
      { tgId: userId },
      {
        ...rewardText,
        lastMysteryBox: now
      }
    );

    bot.sendMessage(chatId, message);
  }
);


registerCommand(
  /^\/endseason$/,
  "End ranked season and reward players",
  async (msg) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id.toString();

    if (!ADMIN.includes(adminId)) {
      return bot.sendMessage(chatId, "🚫 Admin only.");
    }

    const Leaderboard = require("./db/models/Leaderboard");
    const User = require("./db/models/User");

    // 🔒 Get leaderboard
    const lb = await Leaderboard.findOne();

    if (!lb) {
      return bot.sendMessage(chatId, "❌ Leaderboard not initialized.");
    }

    if (lb.seasonEnded) {
      return bot.sendMessage(
        chatId,
        "⚠️ This season has already been ended."
      );
    }

    const season = lb.currentSeason;

    // 🏆 Rank players
    const ranked = Object.entries(lb.scores || {})
      .sort(
        (a, b) =>
          (b[1]?.seasons?.[season] || 0) -
          (a[1]?.seasons?.[season] || 0)
      );

    // 🎁 Reward users
    for (let index = 0; index < ranked.length; index++) {
      const [telegramId] = ranked[index];

      let update = {};

      if (index === 0) {
        update = {
          $inc: { coins: 5000 },
          $push: { badges: `🏆 Season ${season} Champion` }
        };
      } else if (index < 5) {
        update = { $inc: { coins: 2000 } };
      } else if (index < 10) {
        update = { $inc: { coins: 1000 } };
      } else if (index < 50) {
        update = { $inc: { coins: 300 } };
      } else {
        continue;
      }

      await User.updateOne(
        { telegramId },
        update
      );
    }

    // 🔁 Advance season (ATOMIC)
    lb.currentSeason += 1;
    lb.seasonEnded = true;
    await lb.save();

    // 📣 Notify all users (safe)
    const users = await User.find({}, { tgId: 1 });

    for (const u of users) {
      bot.sendMessage(
        u.telegramId,
        `🎉 <b>Season ${season} has ended!</b>\n\n` +
        `🏆 Rewards have been distributed.\n` +
        `🚀 Season ${lb.currentSeason} has now begun!\n\n` +
        `Start battling to climb the leaderboard again 💪`,
        { parse_mode: "HTML" }
      ).catch(() => {});
    }

    bot.sendMessage(
      chatId,
      `✅ Season ${season} ended successfully.\nUsers rewarded & notified.`
    );
  }
);


let activeBattles = {};
registerCommand(
  /\/codebattle(?:\s+@(\w+))?/,
  "Challenge another user to a code battle",
  (msg, match) => {
    const challengerId = msg.from.id.toString();

    // Case 1: Challenger typed a username directly
    if (match[1]) {
      const opponentUsername = match[1];
      const opponent = Object.values(users).find(u => u.username === opponentUsername);

      if (!opponent) {
        return bot.sendMessage(msg.chat.id, "❌ Opponent not found.");
      }

      return sendBattleRequest(challengerId, opponent.id, msg.chat.id);
    }

    // Case 2: No username -> show inline keyboard
    const availableUsers = Object.values(users).filter(u => u.id !== challengerId);
    if (availableUsers.length === 0) {
      return bot.sendMessage(msg.chat.id, "❌ No other users available to challenge.");
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: availableUsers.map(u => [
          { text: `@${u.username}`, callback_data: `battle_${challengerId}_${u.id}` }
        ])
      }
    };

    bot.sendMessage(msg.chat.id, "⚔ Choose a user to challenge:", keyboard);
  }
);

// Handle user selection via inline button
bot.on("callback_query", (callbackQuery) => {
  const data = callbackQuery.data;

  if (data.startsWith("battle_")) {
    const [, challengerId, opponentId] = data.split("_");
    sendBattleRequest(challengerId, opponentId, callbackQuery.message.chat.id);
    bot.answerCallbackQuery(callbackQuery.id);
  }

  if (data.startsWith("accept_")) {
    const [, battleId] = data.split("_");
    const battle = activeBattles[battleId];
    if (!battle) return;

    bot.sendMessage(
      battle.chatId,
      `✅ @${users[battle.opponent].username} accepted the challenge from @${users[battle.challenger].username}!\nThe battle begins now!`
    );

    // TODO: start sending questions in DM
  }

  if (data.startsWith("decline_")) {
    const [, battleId] = data.split("_");
    const battle = activeBattles[battleId];
    if (!battle) return;

    bot.sendMessage(
      battle.chatId,
      `❌ @${users[battle.opponent].username} declined the challenge from @${users[battle.challenger].username}.`
    );

    delete activeBattles[battleId];
  }
});

// Function to send battle request with Accept/Decline
function sendBattleRequest(challengerId, opponentId, chatId) {
  const battleId = `${challengerId}_${opponentId}_${Date.now()}`;

  activeBattles[battleId] = {
    challenger: challengerId,
    opponent: opponentId,
    scores: { [challengerId]: 0, [opponentId]: 0 },
    questionIndex: 0,
    chatId
  };

  const challenger = users[challengerId];
  const opponent = users[opponentId];

  // Notify group
  bot.sendMessage(
    chatId,
    `⚔ @${challenger.username} has challenged @${opponent.username} to a code battle!\nWaiting for @${opponent.username} to respond...`
  );

  // DM opponent with Accept/Decline buttons
  bot.sendMessage(opponentId, `⚔ You have been challenged to a code battle by @${challenger.username}!`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Accept", callback_data: `accept_${battleId}` }],
        [{ text: "❌ Decline", callback_data: `decline_${battleId}` }]
      ]
    }
  });
}

registerCommand(
  /\/codebattle(?:\s+@(\w+))?/,
  "Challenge another user to a code battle",
  async (msg, match) => {
    const chatId = msg.chat.id;
    const challengerId = msg.from.id.toString();

    const User = require("./db/models/User");
    const CodeBattle = require("./db/models/CodeBattle");

    // 🔎 Get challenger
    const challenger = await User.findOne({ tgId: challengerId });
    if (!challenger) {
      return bot.sendMessage(chatId, "❌ You are not registered.");
    }

    // Case 1: username provided
    if (match[1]) {
      const opponent = await User.findOne({ username: match[1] });

      if (!opponent) {
        return bot.sendMessage(chatId, "❌ Opponent not found.");
      }

      return sendBattleRequest(challenger, opponent, chatId);
    }

    // Case 2: show inline list
    const users = await User.find(
      { tgId: { $ne: challengerId }, username: { $exists: true } },
      { tgId: 1, username: 1 }
    ).limit(10);

    if (!users.length) {
      return bot.sendMessage(chatId, "❌ No users available to challenge.");
    }

    bot.sendMessage(chatId, "⚔ Choose a user to challenge:", {
      reply_markup: {
        inline_keyboard: users.map(u => [
          {
            text: `@${u.username}`,
            callback_data: `battle_${challengerId}_${u.telegramId}`
          }
        ])
      }
    });
  }
);
bot.on("callback_query", async (q) => {
  const CodeBattle = require("./db/models/CodeBattle");
  const User = require("./db/models/User");

  const data = q.data;

  if (data.startsWith("battle_")) {
    const [, challengerId, opponentId] = data.split("_");

    const challenger = await User.findOne({ tgId: challengerId });
    const opponent = await User.findOne({ tgId: opponentId });

    if (!challenger || !opponent) return;

    await sendBattleRequest(challenger, opponent, q.message.chat.id);
    return bot.answerCallbackQuery(q.id);
  }

  if (data.startsWith("accept_")) {
    const battleId = data.split("_")[1];

    const battle = await CodeBattle.findOne({ battleId });
    if (!battle) return;

    battle.status = "active";
    await battle.save();

    const challenger = await User.findOne({ tgId: battle.challengerId });
    const opponent = await User.findOne({ tgId: battle.opponentId });

    bot.sendMessage(
      battle.chatId,
      `✅ @${opponent.username} accepted the challenge from @${challenger.username}!\nThe battle begins now!`
    );

    bot.answerCallbackQuery(q.id);
  }

  if (data.startsWith("decline_")) {
    const battleId = data.split("_")[1];

    await CodeBattle.updateOne(
      { battleId },
      { $set: { status: "declined" } }
    );

    bot.answerCallbackQuery(q.id);
  }
});



// ===== Leaderboard system (top 30 + weekly) =====
//const LB_PATH = './leaderboard_data.json';


function loadLeaderboardData() {
  try {
    return JSON.parse(fs.readFileSync(LB_PATH, 'utf8'));
  } catch (e) {
    return { users: {}, lastWeeklySnapshot: {}, lastWeeklyResetAt: 0 };
  }
}
function saveLeaderboardData(data) {
  fs.writeFileSync(LB_PATH, JSON.stringify(data, null, 2));
}

let lbData = loadLeaderboardData();

// Helper: determine premium tier emoji based on expiry ms
function getPremiumBadge(expiryMs) {
  if (!expiryMs) return ''; // not premium
  const remainingDays = Math.max(0, Math.floor((expiryMs - Date.now()) / (24*60*60*1000)));
  // choose tiers (you can tweak thresholds)
  if (remainingDays >= 30) return '🦅';      // Legend
  if (remainingDays >= 20) return '👑';      // VIP
  if (remainingDays >= 10)  return '🥇';      // Gold
  if (remainingDays >= 5)  return '🥈';      // Silver
  return '🥉';                                // Bronze
}

// Internal: ensure user exists
async function ensureLbUser(userId) {
  const Leaderboard = require("./db/models/Leaderboard");

  await Leaderboard.updateOne(
    { tgId: userId },
    { $setOnInsert: { tgId: userId } },
    { upsert: true }
  );
}


// Public: add points (call this from your battle/game code)
async function addPoints(
  userId,
  points = 0,
  { gamePlayed = true, win = false } = {}
) {
  const Leaderboard = require("./db/models/Leaderboard");

  const update = {
    $inc: {
      mainPoints: points,
      weeklyPoints: points,
      gamesPlayed: gamePlayed ? 1 : 0,
      wins: win ? 1 : 0
    }
  };

  await Leaderboard.updateOne(
    { tgId: userId },
    update,
    { upsert: true }
  );
}


// Public: set premium expiry for user (ms)
function setPremium(userId, expiryMs) {
  ensureLbUser(userId);
  lbData.users[userId].premiumExpiry = expiryMs;
  saveLeaderboardData(lbData);
}

// Get sorted arrays
function getSortedUsersByMain() {
  return Object.entries(lbData.users)
    .map(([id, u]) => ({ id, ...u }))
    .sort((a,b) => (b.mainPoints || 0) - (a.mainPoints || 0));
}
function getSortedUsersByWeekly() {
  return Object.entries(lbData.users)
    .map(([id, u]) => ({ id, ...u }))
    .sort((a,b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0));
}
function formatLeaderboard(list, title = "Leaderboard") {
  if (!list || !list.length) {
    return `<b>${title} Leaderboard</b>\n\nNo data yet.`;
  }

  const medals = ["🥇", "🥈", "🥉"];

  const lines = list.map((user, index) => {
    const rank = medals[index] || `#${index + 1}`;
    const name = user.displayName || user.username || "Unknown";
    const score = user.coins ?? user.points ?? 0;

    return `${rank} ${name} — <b>${score}</b>`;
  });

  return `<b>🏆 ${title} Leaderboard</b>\n\n${lines.join("\n")}`;
}

async function getSortedUsers(type = "main", limit = 30) {
  const Leaderboard = require("./db/models/Leaderboard");
  const User = require("./db/models/User");

  const sortField = type === "main" ? "mainPoints" : "weeklyPoints";

  const rows = await Leaderboard
    .find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();

  const userIds = rows.map(r => r.telegramId);
  const users = await User.find(
    { tgId: { $in: userIds } },
    { tgId: 1, username: 1, premiumExpires: 1 }
  ).lean();

  const userMap = Object.fromEntries(
    users.map(u => [u.telegramId, u])
  );

  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    user: userMap[r.telegramId]
  }));
}

// Format rank change vs lastWeeklySnapshot
function formatRankChange(userId, newRank) {
  const prev = lbData.lastWeeklySnapshot[userId];
  if (!prev) return '➡️'; // no previous => consider unchanged
  if (prev > newRank) return `⬆️ ${prev - newRank}`; // moved up
  if (prev < newRank) return `⬇️ ${newRank - prev}`; // moved down
  return '➡️'; // same
}

// Build leaderboard message (topN, "main" or "weekly")
function buildLeaderboardMessage(type = 'main', topN = 30) {
  const list = type === 'main' ? getSortedUsersByMain() : getSortedUsersByWeekly();
  const top = list.slice(0, topN);
  if (top.length === 0) return `🏆 ${type === 'main' ? 'Main' : 'Weekly'} Leaderboard is empty.`;

  const medal = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
  const lines = top.map((u, i) => {
    const badge = getPremiumBadge(u.premiumExpiry) || '';
    const nameDisplay = badge ? `${badge} <b>${escapeHTML(u.username || 'Unknown')}</b>` : escapeHTML(u.username || 'Unknown');
    const pts = type === 'main' ? u.mainPoints || 0 : u.weeklyPoints || 0;
    let change = '';
    if (type === 'weekly') {
      change = ' ' + formatRankChange(u.id, i+1);
    }
    return `${medal(i)} ${nameDisplay} — ${pts} pts${change}`;
  });

  return `🏆 ${type === 'main' ? 'Main' : 'Weekly'} Leaderboard (Top ${Math.min(topN, top.length)}):\n\n` + lines.join('\n');
}

// Commands to show leaderboards
registerCommand(/\/leaderboard_main$/, "Main Leaderboard", async (msg) => {
  const list = await getSortedUsers("main", 30);
  const text = formatLeaderboard(list, "Main");
  bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
});

registerCommand(/\/leaderboard_week$/, "Weekly Leaderboard", async (msg) => {
  const list = await getSortedUsers("weekly", 30);
  const text = formatLeaderboard(list, "Weekly");
  bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" });
});


async function snapshotWeeklyRanksAndReset() {
  const Leaderboard = require("./db/models/Leaderboard");
  const LeaderboardMeta = require("./db/models/LeaderboardMeta");
  const User = require("./db/models/User");

  // 1️⃣ Get sorted weekly leaderboard
  const weekly = await Leaderboard
    .find()
    .sort({ weeklyPoints: -1 })
    .lean();

  if (weekly.length === 0) return;

  // 2️⃣ Build snapshot
  const snapshot = {};
  weekly.forEach((u, idx) => {
    snapshot[u.telegramId] = idx + 1;
  });

  // 3️⃣ Save snapshot + reset time
  await LeaderboardMeta.updateOne(
    { key: "weekly" },
    {
      $set: {
        lastWeeklySnapshot: snapshot,
        lastWeeklyResetAt: Date.now()
      }
    },
    { upsert: true }
  );

  // 4️⃣ Best player announcement
  const best = weekly[0];
  if (best) {
    const bestUser = await User.findOne(
      { tgId: best.telegramId },
      { username: 1, premiumExpires: 1 }
    ).lean();

    const badge = getPremiumBadge(bestUser?.premiumExpires);
    const announcement =
      `🏆 <b>Best Player of the Week</b>\n\n` +
      `${badge ? badge + " " : ""}<b>${escapeHTML(bestUser?.username || "Unknown")}</b>\n` +
      `🔥 ${best.weeklyPoints} points`;

    const allUsers = await User.find({}, { tgId: 1 }).lean();
    for (const u of allUsers) {
      bot.sendMessage(u.telegramId, announcement, { parse_mode: "HTML" })
        .catch(() => {});
    }
  }

  // 5️⃣ Reset weekly points + store lastWeekRank
  const bulk = weekly.map(u => ({
    updateOne: {
      filter: { tgId: u.telegramId },
      update: {
        $set: {
          weeklyPoints: 0,
          lastWeekRank: snapshot[u.telegramId] || null
        }
      }
    }
  }));

  if (bulk.length) {
    await Leaderboard.bulkWrite(bulk);
  }
}

// Admin helper: snapshot weekly ranks (call on weekly reset)

// Schedule weekly reset: run snapshot at a weekly interval.
// Implementation choice: run once every day at server startup check if more than 7 days since last reset.
// This avoids fragile cron/timezone issues.
async function maybeRunWeeklyReset() {
  const LeaderboardMeta = require("./db/models/LeaderboardMeta");
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  const meta = await LeaderboardMeta.findOne({ key: "weekly" }).lean();

  if (!meta || !meta.lastWeeklyResetAt || Date.now() - meta.lastWeeklyResetAt > oneWeek) {
    await snapshotWeeklyRanksAndReset();
  }
}

// call at startup
maybeRunWeeklyReset();
// and also set interval to check daily
setInterval(maybeRunWeeklyReset, 24*60*60*1000); // check once a day

// Utility: expose function to get a user's leaderboard rank (main & weekly)
function getUserRanks(userId) {
  const mainList = getSortedUsersByMain();
  const weeklyList = getSortedUsersByWeekly();
  const mainRank = mainList.findIndex(u => u.id === userId) + 1 || null;
  const weeklyRank = weeklyList.findIndex(u => u.id === userId) + 1 || null;
  return { mainRank: mainRank || null, weeklyRank: weeklyRank || null };
}

// Command: /myinfo show ranks and coins (if you store coins in users.json)
registerCommand(/\/myinfo$/, "User info", async (msg) => {
  const userId = msg.from.id.toString();

  const Leaderboard = require("./db/models/Leaderboard");
  const User = require("./db/models/User");

  const lb = await Leaderboard.findOne({ tgId: userId }).lean();
  if (!lb) {
    return bot.sendMessage(msg.chat.id, "❌ You are not on the leaderboard yet.");
  }

  const user = await User.findOne(
    { tgId: userId },
    { username: 1, premiumExpires: 1, coins: 1 }
  ).lean();

  const badge = getPremiumBadge(user?.premiumExpires);
  const ranks = await getUserRanks(userId);

  const info = `
<b>📜 Your Leaderboard Info</b>
👤 ${badge ? badge + " " : ""}<b>${escapeHTML(user?.username || "Unknown")}</b>
🏅 Main points: <b>${lb.mainPoints || 0}</b> (Rank: ${ranks.mainRank || "—"})
🕒 Weekly points: <b>${lb.weeklyPoints || 0}</b> (Rank: ${ranks.weeklyRank || "—"})
🎮 Games played: <b>${lb.gamesPlayed || 0}</b>
🏆 Wins: <b>${lb.wins || 0}</b>
💰 Coins: <b>${user?.coins || 0}</b>
`;

  bot.sendMessage(msg.chat.id, info, { parse_mode: "HTML" });
});


function generateCertificate(user, courseKey) {
  const date = new Date().toLocaleDateString();
  const certId = `${courseKey.toUpperCase()}-${user.telegramId}-${Date.now().toString().slice(-6)}`;

  const name =
    user.username ? `@${user.username}` :
    user.firstName ? user.firstName :
    `User ${user.telegramId}`;

  return `
🎓 <b>CERTIFICATE OF COMPLETION</b>

This certifies that

👤 <b>${escapeHTML(name)}</b>

has successfully completed the

📚 <b>${courseKey.toUpperCase()} Premium Course</b>

📅 Date: ${date}
🆔 Certificate ID: <code>${certId}</code>

💎 Issued by: Your Premium Learning Program
`;
}





// ===== Premium Courses Data =====
const premiumCourses = {
  ai: [
  { 
    title: "Intro to AI",
    content: `
Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems.  
In this lesson, you'll learn about the origins of AI, its evolution, and how it impacts various sectors today.

📘 **What You’ll Learn:**
- History: From symbolic AI to modern machine learning  
- Key AI fields: rule-based systems, expert systems, machine learning, and robotics  
- Applications: AI in healthcare (diagnosis), finance (fraud detection), autonomous vehicles, and entertainment (recommendation engines)  
- Ethical considerations: Privacy, bias in algorithms, transparency, and societal impact

🔍 **Example:**  
Think of AI as the “brain” behind Siri, Google Assistant, and many smart systems you use daily.

This foundational knowledge sets the stage for more advanced AI topics.` , 
    video: "https://www.youtube.com/watch?v=2ePf9rue1Ao" 
  },
  { 
    title: "Machine Learning Mastery", 
    content: `
Machine Learning (ML) is a subset of AI where computers learn from data to make predictions or decisions without being explicitly programmed.

📘 **What You’ll Learn:**
- Types of ML: supervised (e.g., spam email classification), unsupervised (e.g., customer segmentation), and reinforcement learning (e.g., game-playing agents)  
- Algorithms: decision trees, support vector machines, clustering algorithms  
- Data preparation and feature engineering essentials  
- Model evaluation: accuracy, precision, recall, and overfitting

🔍 **Example Project:**  
Build a spam filter that automatically classifies incoming emails based on past labeled examples.

Hands-on experience with ML pipelines is essential for real-world AI applications.` , 
    video: "https://www.youtube.com/watch?v=ukzFI9rgwfU" 
  },
  { 
    title: "Deep Learning with Neural Networks", 
    content: `
Deep Learning is an advanced ML technique using neural networks inspired by the human brain to model complex patterns.

📘 **What You’ll Learn:**
- Neural Network basics: neurons, layers, activation functions  
- Convolutional Neural Networks (CNNs) for image processing tasks  
- Recurrent Neural Networks (RNNs) for sequential data like text and speech  
- Frameworks: TensorFlow, PyTorch basics and model deployment  
- Training techniques: backpropagation, gradient descent, dropout for regularization

🔍 **Example Projects:**  
- Image classification with CNNs (e.g., recognize cats vs dogs)  
- Text generation with RNNs (e.g., generate poetry or code snippets)

Mastering deep learning opens doors to state-of-the-art AI solutions.` , 
    video: "https://www.youtube.com/watch?v=aircAruvnKk" 
  },
  { 
    title: "AI in Natural Language Processing (NLP)", 
    content: `
NLP focuses on enabling machines to understand, interpret, and generate human language.

📘 **What You’ll Learn:**
- Text preprocessing: tokenization, stemming, lemmatization  
- Sentiment analysis: determining emotional tone from text  
- Language translation models  
- Building chatbots using frameworks and APIs like Hugging Face Transformers and OpenAI GPT  
- Challenges: ambiguity, sarcasm, and context understanding

🔍 **Example Project:**  
Create a chatbot that understands user queries and provides helpful responses.

NLP is key to many conversational AI applications.` , 
    video: "https://www.youtube.com/watch?v=fNxaJsNG3-s" 
  },
  { 
    title: "AI for Computer Vision", 
    content: `
Computer Vision enables computers to interpret and analyze visual information from the world.

📘 **What You’ll Learn:**
- Image processing basics: filtering, edge detection  
- Object detection and image segmentation techniques  
- Generative models for creating images (GANs)  
- Applications: face recognition, autonomous vehicle vision, medical image analysis

🔍 **Example Projects:**  
Build a face recognition app or a system that identifies objects in photos.

Computer Vision is transforming industries like security, healthcare, and automotive.` , 
    video: "https://www.youtube.com/watch?v=PmZ29Vta7Vc" 
  },
  { 
    title: "AI Ethics and Future Trends", 
    content: `
AI brings amazing possibilities but also serious challenges and responsibilities.

📘 **What You’ll Learn:**
- Ethical concerns: algorithmic bias, data privacy, job displacement  
- AI governance and regulations worldwide  
- Emerging trends: Artificial General Intelligence (AGI), AI creativity, and human-AI collaboration  
- How to build ethical AI systems that are transparent and fair

🔍 **Example Discussion:**  
Analyze the impact of AI on employment and societal norms.

Understanding ethics ensures AI benefits all humanity responsibly.` , 
    video: "https://www.youtube.com/watch?v=FzI9bHH9d3c" 
  }
],
  blockchain: [
  {
    title: "Blockchain Fundamentals",
    content: `
Dive into the foundation of blockchain: a decentralized, immutable ledger that powers digital currencies and beyond.
Learn about:
• How blocks, chains, and consensus (Proof of Work / Proof of Stake) work    
• The structure of a block — headers, transactions, and hashes    
• Why decentralization enhances security and transparency    
Gain hands-on insights into how chains validate and connect every transaction.`,
    video: "https://www.youtube.com/watch?v=SSo_EIwHSd4"
  },
  {
    title: "Smart Contracts with Solidity",
    content: `
Master the creation of self-executing contracts on Ethereum using Solidity.
Key topics include:
• Contract structure: state variables, functions, and modifiers    
• Deploying contracts on testnets and handling gas costs    
• Common patterns: SafeMath, ownership, and access control    
• Best practices: security audits, reentrancy protection, and optimized gas usage`,
    video: "https://www.youtube.com/watch?v=gyMwXuJrbJQ"
  },
  {
    title: "Building Web3 DApps",
    content: `
Take your blockchain skills further into Web3 development—build decentralized apps (DApps) that interact with smart contracts.
You’ll learn:
• Connecting to Ethereum from the browser using Web3.js or Ethers.js    
• Wallet integration (MetaMask, WalletConnect)    
• Building user interfaces to read/write blockchain data    
• Deployment pipelines with frameworks like Hardhat, Truffle, or Foundry`,
    video: "https://www.youtube.com/watch?v=8jI1TuEaTro"
  },
  {
    title: "DeFi (Decentralized Finance) Essentials",
    content: `
Understand how blockchain powers a new era of finance without banks.
We cover:
• Lending and borrowing on decentralized protocols    
• Automated market makers (AMMs) and liquidity pools    
• Yield farming, staking, and governance tokens    
• Risks: impermanent loss, rug pulls, and security issues`,
    video: "https://www.youtube.com/watch?v=3aJI1ABdjQk"
  },
  {
    title: "NFTs and Digital Asset Tokenization",
    content: `
Learn how Non-Fungible Tokens (NFTs) are reshaping art, gaming, and identity.
We’ll explore:
• ERC-721 and ERC-1155 standards    
• Minting, buying, and selling NFTs on marketplaces    
• NFT metadata, royalties, and smart contract integration    
• Future use cases: identity verification, real estate, and gaming assets`,
    video: "https://www.youtube.com/watch?v=Xdkkux6OxfM"
  },
  {
    title: "Blockchain Security and Auditing",
    content: `
Discover the best practices to secure blockchain apps and smart contracts.
We’ll cover:
• Common vulnerabilities: reentrancy, integer overflow, phishing    
• Security audit tools like MythX, Slither, and OpenZeppelin Defender    
• Safe contract upgrade patterns    
• Real-world hacks and how they could have been prevented`,
    video: "https://www.youtube.com/watch?v=UFT5NdS5oto"
  }
],

  cybersecurity: [
  {
    title: "Cybersecurity Foundations",
    content: `
Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks.  
Think of it like locking your house — but instead of burglars, you have hackers, malware, and data thieves trying to break in.

📘 **What You’ll Learn in This Lesson:**
1. **The CIA Triad** –  
   • **Confidentiality**: Only authorized people can access data.  
     _Example_: Encrypting files with \`gpg --encrypt file.txt\`  
   • **Integrity**: Data isn’t altered without permission.  
     _Example_: Using SHA-256 hashes to verify file downloads:  
     \`\`\`bash
     sha256sum file.iso
     \`\`\`  
   • **Availability**: Systems are online when needed.  
     _Example_: Load balancing web servers to avoid downtime.

2. **Common Threats** –  
   • **Malware**: viruses, ransomware, spyware.  
   • **Phishing**: fake emails tricking you into giving passwords.  
   • **DoS/DDoS attacks**: flooding a server until it crashes.  
   _Real case_: GitHub survived the largest DDoS attack in 2018 with 1.35 Tbps traffic.

3. **Best Practices** –  
   • Use strong passwords (\`openssl rand -base64 16\` generates a secure one).  
   • Keep systems updated (\`apt update && apt upgrade\`).  
   • Use encryption everywhere (HTTPS, SSH).

4. **Risk Management Basics** –  
   Identify assets → Identify threats → Apply controls → Monitor & review.

💡 **Why This is Important:**  
Without solid foundations, advanced security techniques fail. This lesson sets you up to think like a security architect from day one.`,
    video: "https://www.youtube.com/watch?v=USg3NR76XpQ"
  },
  {
    title: "Network Security Basics",
    content: `
The network is where most attacks begin. Securing it is your first line of defense.

📘 **Key Concepts:**
1. **Firewalls** –  
   Control incoming and outgoing traffic using rules.  
   _Example_: Block all inbound traffic except SSH (port 22):  
   \`\`\`bash
   sudo ufw default deny incoming
   sudo ufw allow 22/tcp
   sudo ufw enable
   \`\`\`

2. **Network Segmentation** –  
   Separate critical systems from less secure ones.  
   _Example_: Keep IoT devices on a separate VLAN so they can’t reach your servers.

3. **Secure Protocols** –  
   Always use encrypted protocols:  
   • HTTPS instead of HTTP  
   • SFTP instead of FTP  
   • SSH instead of Telnet

4. **Packet Inspection** –  
   Tools like \`tcpdump\` or \`Wireshark\` can detect malicious traffic patterns.  
   _Example_: Capture packets on port 80:  
   \`\`\`bash
   sudo tcpdump -i eth0 port 80
   \`\`\`

💡 **Why This is Important:**  
A poorly secured network is like leaving the front door wide open — no matter how strong your passwords are.`,
    video: "https://www.youtube.com/watch?v=qiQR5rTSshw"
  },
  {
    title: "Linux Security Essentials",
    content: `
Most servers run on Linux, so mastering its security is a must for any cybersecurity professional.

📘 **Core Skills:**
1. **User & Permission Management** –  
   • View permissions: \`ls -l\`  
   • Change file permissions: \`chmod 600 file.txt\`  
   • Use groups to limit access.

2. **SSH Hardening** –  
   Edit \`/etc/ssh/sshd_config\` to:  
   • Disable root login (\`PermitRootLogin no\`)  
   • Change default port from 22 to something higher.

3. **Service Auditing** –  
   Find active services:  
   \`\`\`bash
   sudo netstat -tulpn
   \`\`\`  
   Disable unused ones to reduce attack surface.

4. **Log Monitoring** –  
   View auth logs:  
   \`\`\`bash
   sudo tail -f /var/log/auth.log
   \`\`\`  
   Look for suspicious login attempts.

💡 **Why This is Important:**  
Even the most advanced app security won’t help if your underlying OS is wide open to attack.`,
    video: "https://www.youtube.com/watch?v=K1iu1kXkVoA"
  }
],

insider: [
  {
    title: "Exclusive Tips from Industry Experts",
    content: `
Get insider insights to accelerate your coding career and level up fast. These tips come from seasoned developers, tech leads, and hiring managers who’ve seen what works — and what doesn’t.

📘 **What You’ll Learn in This Lesson:**

1. **Focus on Fundamentals**  
Master data structures, algorithms, and system design — they’re the foundation for solving any problem.  
_Example_: Practice solving problems on LeetCode or HackerRank daily.

2. **Write Clean, Readable Code**  
Code is read more often than written. Follow naming conventions, keep functions small, and document as you go.  
_Tip_: Use tools like ESLint and Prettier to maintain code quality automatically.

3. **Build Real Projects**  
Create portfolio projects that solve real-world problems. Contribute to open source or build apps you’re passionate about.  
_Example_: Build a personal website with a blog, or a simple chat app.

4. **Networking and Mentorship**  
Connect with developers via Twitter, LinkedIn, or local meetups. Seek mentors who can guide your career growth.  
_Tip_: Participate in hackathons and coding communities like GitHub, Stack Overflow.

5. **Stay Updated**  
Technology evolves fast — read blogs, follow thought leaders, watch conference talks.  
_Example_: Subscribe to newsletters like JavaScript Weekly or Python Weekly.

💡 **Why This is Important:**  
The tech industry values problem solvers who can adapt, communicate, and collaborate effectively. These insider tips help you become that developer.`,

    video: "https://www.youtube.com/watch?v=G2E5PlQFZmE"
  },
  {
    title: "Career Secrets: Job Hunting & Freelancing",
    content: `
Break into the tech world or boost your freelance income with proven strategies from recruiters and successful freelancers.

📘 **What You’ll Learn in This Lesson:**

1. **Crafting Your Resume and Portfolio**  
Tailor your resume for each job. Showcase projects with descriptions, tech used, and results. Use GitHub and LinkedIn effectively.  
_Tip_: Use action verbs and quantify achievements (e.g., “Improved app load time by 40%”).

2. **Acing Technical Interviews**  
Prepare for coding challenges, system design questions, and behavioral interviews.  
_Example_: Use sites like InterviewBit and Pramp for mock interviews.

3. **Freelance Platforms & Client Management**  
Learn the top freelance websites (Upwork, Fiverr, Toptal) and how to pitch clients effectively.  
_Tip_: Set clear scopes, deliver on time, and ask for reviews to build reputation.

4. **Pricing Your Work & Negotiation**  
Understand market rates, how to set hourly vs fixed prices, and negotiation tactics.  
_Example_: Start with lower prices for building portfolio, then increase as you gain trust.

5. **Avoiding Burnout & Time Management**  
Balance multiple projects with calendars, task managers, and healthy work routines.  
_Tip_: Use Pomodoro timers and block distractions for peak productivity.

💡 **Why This is Important:**  
Success is not just about coding skills — it’s about how you market yourself, manage clients, and sustain your energy for long-term growth.`,

    video: "https://www.youtube.com/watch?v=3pOqCtq7Ltg"
  }
]
};

// ===== Command: /buypremium =====
/*bot.onText(/^\/buypremium (\d+)(?:d|day|days)$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const days = parseInt(match[1]);
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;

  premiumUsers[userId] = { expires: expiry };

  savePremiumData();

  bot.sendMessage(chatId, `✅ You now have *Premium Access* for ${days} day(s)!`, { parse_mode: "Markdown" });
  bot.sendMessage(chatId, `🔗 Your premium group link: https://t.me/yourpremiumgroup\n\n🔥 *Premium Perks*:\n- AI Advanced Course\n- Blockchain Mastery\n- Cybersecurity Pro\n- Insider Tips\n- Exclusive Video Tutorials`, { parse_mode: "Markdown" });

  setTimeout(() => {
    if (premiumUsers[userId] && Date.now() > premiumUsers[userId].expires) {
      delete premiumUsers[userId];
      savePremiumData();
      bot.kickChatMember("@yourpremiumgroup", userId);
      bot.sendMessage(chatId, "⚠️ Your premium has expired. Upgrade again to regain access.");
    }
  }, days * 24 * 60 * 60 * 1000);
});*/

// ===== Command: /premiumcourse =====
registerCommand(/\/premiumcourses$/, "List premium courses", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const { getUserByInternalId } = require("./db/userService");

  const user = await getUserByInternalId(userId);

  if (!user?.premium?.isPremium || user.premium.expiresAt < Date.now()) {
    return bot.sendMessage(chatId,
      "🚫 Premium only feature.\nUse /buypremium to unlock 💎"
    );
  }

  const list = Object.keys(premiumCourses)
    .map(c => `• <b>${c.toUpperCase()}</b>`)
    .join("\n");

  bot.sendMessage(chatId,
    `<b>📚 Premium Courses</b>\n\n${list}\n\nUse:\n<code>/premiumcourse ai</code>`,
    { parse_mode: "HTML" }
  );
});


const activeCourseSessions = {};

registerCommand(/^\/premiumcourse (\w+)$/i, "Start premium course", async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const courseKey = match[1].toLowerCase();
  const { getUserByInternalId } = require("./db/userService");

  const user = await getUserByInternalId(userId);

  if (!user) {
    return bot.sendMessage(chatId, "❌ You are not registered.");
  }

  if (!user.premium?.isPremium || user.premium.expiresAt < Date.now()) {
    return bot.sendMessage(chatId,
      "🚫 Premium only feature.\nUse /buypremium to unlock 💎"
    );
  }

  if (!premiumCourses[courseKey]) {
    return bot.sendMessage(chatId,
      "❌ Course not found.\nUse /premiumcourses to see available courses."
    );
  }

  activeCourseSessions[userId] = {
    courseKey,
    lessonIndex: 0
  };

  sendLesson(chatId, userId);
});


registerCommand(/\/prevcourse$/, "Previous premium lesson", (msg) => {
  const userId = msg.from.id.toString();
  const chatId = msg.chat.id;
  const session = activeCourseSessions[userId];

  if (!session || session.lessonIndex === 0) {
    return bot.sendMessage(chatId, "⚠️ This is the first lesson.");
  }

  session.lessonIndex--;
  sendLesson(chatId, userId);
});



registerCommand(/\/nextprem$/, "Next premium lesson", async (msg) => {
  const userId = msg.from.id.toString();
  const chatId = msg.chat.id;
  const session = activeCourseSessions[userId];

  if (!session) {
    return bot.sendMessage(
      chatId,
      "⚠️ No active course.\nUse /premiumcourses to start one."
    );
  }

  const course = premiumCourses[session.courseKey];
  session.lessonIndex++;

  // Course completed
  if (session.lessonIndex >= course.length) {
    const { getUserByInternalId } = require("./db/userService");
    const user = await getUserByInternalId(userId);
    if (!user) return;

    const certificate = generateCertificate(user, session.courseKey);
    delete activeCourseSessions[userId];

    return bot.sendMessage(
      chatId,
      `🎉 <b>Course Completed!</b>\n\n${certificate}`,
      { parse_mode: "HTML" }
    );
  }

  sendLesson(chatId, userId);
});




function sendLesson(chatId, userId) {
  const session = activeCourseSessions[userId];
  if (!session) return;

  const course = premiumCourses[session.courseKey];
  const lesson = course[session.lessonIndex];

  bot.sendMessage(chatId,
    `📘 <b>${lesson.title}</b>\n\n${lesson.content}\n\n🎥 <a href="${lesson.video}">Watch Video</a>\n\n` +
    `📍 Lesson ${session.lessonIndex + 1} of ${course.length}\n\n` +
    `➡️ /nextprem   ⬅️ /prevcourse`,
    { parse_mode: "HTML", disable_web_page_preview: false }
  );
}



// ===== Helper: Save Premium Data =====
function savePremiumData() {
  fs.writeFileSync("premium.json", JSON.stringify(premiumUsers, null, 2));
}


// ===== Utility: call Groq API for explanations & Q&A =====
async function getGroqResponse(question) {
  // Example API call - replace with your actual API logic
  const response = await axios.post('https://api.groq.dev/v1/complete', {
    prompt: question,
    max_tokens: 200,
  }, {
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
  });

  return response.data.choices[0].text.trim();
}

// ===== Bot start message on launch =====
console.log('🤖 TrustBuddyBot started and running...');

