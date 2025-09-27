//require('dotenv').config();
require("dotenv").config();
const { exec } = require("child_process");


const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const fs = require('fs');
const axios = require('axios');
const { checkPremiumExpiry } = require('./quizTask'); // adjust path
// import { exec } from "child_process";

function loadJSON(path) {
  try {
    if (!fs.existsSync(path)) return {};
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    console.error('Error loading JSON from', path, e);
    return {};
  }
}
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




function saveJSON(path, data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving JSON to', path, e);
  }
}
let users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));



const path = './users.json';
const mailboxFile = './mailboxes.json';

function readMailboxes() {
  try {
    return JSON.parse(fs.readFileSync(mailboxFile));
  } catch {
    return {};
  }
}

function writeMailboxes(data) {
  fs.writeFileSync(mailboxFile, JSON.stringify(data, null, 2));
}
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

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return {};
  }
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


function formatName(user) {
  let badge = "";
  if (user.isPremium && user.premiumExpires > Date.now()) badge += "💎 ";
  if (user.badge && (!user.badgeExpires || user.badgeExpires > Date.now())) badge += user.badge + " ";
  return badge + (user.name || "Unknown");
}


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


function getUserId(msg) {
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
}

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

// ===== Premium Users Storage =====
let premiumUsers = [];
const premiumFile = './premium.json';

function loadPremium() {
  try {
    premiumUsers = JSON.parse(fs.readFileSync(premiumFile, 'utf-8')).premium_users || [];
  } catch (err) {
    premiumUsers = [];
  }
}
function savePremium() {
  fs.writeFileSync(premiumFile, JSON.stringify({ premium_users: premiumUsers }, null, 2));
}
loadPremium();

function isPremium(userId) {
  return premiumUsers.includes(userId);
}

function requirePremium(chatId, userId) {
  if (!isPremium(userId)) {
    bot.sendMessage(chatId, 
      `🚫 <b>Premium Feature Locked</b>\n\n` +
      `This feature is only available for <b>Premium Members</b> 💎\n\n` +
      `💳 <b>How to Unlock:</b>\n` +
      `1️⃣ Send a message to <a href="https://t.me/KallmeTrust">Dev Trust</a> to buy Premium.\n` +
      `2️⃣ After payment, you’ll be <b>automatically added</b> to our Premium Users List.\n\n` +
      `🔗 <b>Premium Perks:</b>\n- Full Web Development Course\n- Complete Programming Cheat Sheet\n- Access to VIP Telegram Group`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );
    return false;
  }
  return true;
}

// ===== Bot Setup =====
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
/*const activeSessions = {}; // userId -> { courseKey, lessonIndex, type }
function sendLesson(chatId, userId) {
  const session = activeSessions[userId];
  const course = premiumCourses[session.courseKey];
  const lesson = course[session.lessonIndex];
  bot.sendMessage(chatId,
    `📚 *${lesson.title}*\n\n${lesson.content}\n\n🎥 [Video Link](${lesson.video})`,
    { parse_mode: "Markdown", disable_web_page_preview: false }
  );
}
// 1️⃣ Keep your normal commands as they are
registerCommand(/\/time$/, "Show the current server time (UTC)", timeHandler);
/*registerCommand(/\/profile$/, "Show your profile", profileHandler);
registerCommand(/\/motivate$/, "Send a motivational quote", motivateHandler);*/
// ...all other commands

// 2️⃣ Build an AI command registry that references your handlers
/*const commandRegistry = {
  time: { handler: timeHandler },
  profile: { handler: profileHandler },
  motivate: { handler: motivateHandler },
  funfact: { handler: funFactHandler },
  roastcode: { handler: roastHandler },
  mysterybox: { handler: mysteryBoxHandler },
  inbox: { handler: inboxHandler },
  // add any others you want AI to trigger
};*/
/*const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function interpretUserMessage(userId, text) {
  // Build system prompt describing your bot and its commands
  const systemPrompt = `
I am an AI assistant for a coding/learning bot created by Trust. 
I know all the bot commands and features:
- Premium courses: start, next lesson, get video links.
- Leaderboards: show main or weekly leaderboard, show user info.
- Profile: show user profile.
- Fun: motivate, fun facts, roasts.
- Mystery box: open it, show rewards.
- Inbox: list, read, delete messages.
- Battle rooms: join, leave, status, timeleft, submit code.
Always map user's natural text to one of these actions.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ],
    temperature: 0
  });

  return response.choices[0].message.content;
}
bot.on('message', async (msg) => {
  const text = msg.text?.trim();
  if (!text) return;

  const userId = msg.from.id.toString();

  // Skip normal commands
  if (text.startsWith('/')) return;

  try {
    const commandKey = await interpretUserMessage(userId, text);

    if (commandRegistry[commandKey]) {
      commandRegistry[commandKey].handler(msg); // trigger the existing handler
    } else {
      bot.sendMessage(msg.chat.id, "⚠️ Sorry, I couldn't understand your request. plz inform my owner or use the cmd instead");
    }
  } catch (err) {
    console.error("AI parsing error:", err);
    bot.sendMessage(msg.chat.id, "⚠️ Something went wrong. Try simpler instructions.");
  }
});*/
// Call this inside your /start handler and/or on any message you want to track user activity
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
function registerUser(msg, nameInput) {
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
}


// Start command

const usersPath = './users.json';

function saveUsers() {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

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
  const userId = msg.from.id.toString();
  const username = msg.from.username || "No username";

  // ✅ Check if user is in required channel
  const isMember = await checkMembership(userId);
  if (!isMember) {
    return bot.sendMessage(
      chatId,
      `🚨 You must join our channel to use this bot.\n👉 ${REQUIRED_CHANNEL}`
    );
  }

  // ✅ Existing logic
  if (!users[userId]) {
    bot.sendMessage(
      chatId,
      `👋 Welcome! Your Telegram ID is <b>${userId}</b>\nYour username: @${username}\n\nPlease enter your display name:`,
      { parse_mode: "HTML" }
    );
    waitingForName[userId] = { username };
  } else {
    giveDailyBonus(userId, chatId);
    notifyUnreadMail(userId, chatId);
    showWelcomeMenu(msg);
  }
});


// Capture name for first-time users
bot.on("message", (msg) => {
  const userId = msg.from.id.toString();

  if (waitingForName[userId] && msg.text && !msg.text.startsWith("/")) {
    const { username } = waitingForName[userId];
    const name = msg.text.trim();

    users[userId] = {
      id: userId,
      username,
      displayName: name, // more consistent key name
      joinDate: Date.now(),
      coins: 0,
      points: 0,
      usageCount: 1,
      lastLogin: Date.now(),
      battlesWon: 0,
      battlesLost: 0,
      premium: { isPremium: false, expiresAt: null }
    };

    saveUsers();
    delete waitingForName[userId];

    bot.sendMessage(
      msg.chat.id,
      `✅ Thanks <b>${name}</b>! You are now registered.`,
      { parse_mode: "HTML" }
    );

    notifyUnreadMail(userId, msg.chat.id);
    showWelcomeMenu(msg);
  }
});


// Give daily login bonus
function giveDailyBonus(userId, chatId) {
  let user = users[userId];
  user.usageCount = (user.usageCount || 0) + 1;

  const today = new Date().toDateString();
  if (user.lastLogin !== today) {
    const bonus = 10; // coins
    user.coins = (user.coins || 0) + bonus;
    user.lastLogin = today;
    bot.sendMessage(chatId, `🎁 Daily login bonus: +${bonus} coins!`);
  }

  saveUsers();
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
registerCommand(/\/check/, "Check your profile (coins & premium status)", (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const user = users[userId];

    if (!user) {
        return bot.sendMessage(chatId, "❌ You are not registered. Please use /start to register first.");
    }

    const isPremium = user.premiumUntil && user.premiumUntil > Date.now();

    bot.sendMessage(chatId,
        `📌 <b>Profile</b>\n\n` +
        `💰 Coins: <b>${user.coins}</b>\n` +
        `💎 Premium: ${isPremium ? "✅ Yes" : "❌ No"}`,
        { parse_mode: "HTML" }
    );
});

// /profile command handler
registerCommand(/\/profile(?:\s+(\S+))?/, "View your profile or another user's profile", (msg, match) => {
  const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
  const fromId = msg.from.id.toString();
  const requestedArg = match[1]?.trim(); // could be ID or username
    const user = users[userId];

    if (!user) {
        return bot.sendMessage(chatId, "❌ You are not registered. Please use /start to register first.");
    }

  let targetUser;

  if (requestedArg) {
    // Search by ID or username
    targetUser = Object.values(users).find(u =>
      u.id === requestedArg ||
      (u.username && u.username.toLowerCase() === requestedArg.toLowerCase())
    );

    if (!targetUser) {
      return bot.sendMessage(chatId, `❌ No user found with ID or username "${requestedArg}".`);
    }
  } else {
    // Default: self profile
    targetUser = users[fromId];
    if (!targetUser) {
      return bot.sendMessage(chatId, `❌ You are not registered yet. Use /start to begin.`);
    }
  }

  // Emojis for tiers
  const tierEmojis = {
    vip: "💎",
    pro: "🔥",
    premium: "🌟",
    legend: "👑",
    free: "🆓"
  };

  const tier = (targetUser.tier || "free").toLowerCase();
  const tierIcon = tierEmojis[tier] || "";

  const nameDisplay = escapeMarkdown(targetUser.name || targetUser.displayName || "Unknown");
  const usernameDisplay = targetUser.username ? "@" + escapeMarkdown(targetUser.username) : "No username";
  const joinedDate = targetUser.joinDate ? new Date(targetUser.joinDate).toDateString() : "Unknown";
  const points = targetUser.points || 0;

  const profileText =
`📜 *User Profile*
────────────────
👤 Name: *${nameDisplay}*
💬 Username: ${usernameDisplay}
🏆 Points: *${user.coins}*
${tierIcon} Tier: *${tier.toUpperCase()}*
📅 Joined: *${joinedDate}*`;

  bot.sendMessage(chatId, profileText, { parse_mode: "Markdown" });
});





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
registerCommand(/\/start_(\w+)/, "Start a course by topic name (example: /start_python)", (msg, match) => {
  const chatId = msg.chat.id;
  const topic = match[1].toLowerCase();

  // Check premium restriction
  if (premiumTopics.includes(topic) && !requirePremium(chatId, msg.from.id)) {
    return bot.sendMessage(chatId, "❌ This course is premium only. Please upgrade to access it.");
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

registerCommand(
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

bot.onText(/^\/nanoai(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1]; // undefined if only /nano used

  const prompt = `my name is TrustBit coding bot. I am a helpful programming assistant created by my lovely owner kallmetrust and Lord Samuel. I love solving coding problems and chatting like a human. I am also here to help us code.`;

  // Case 1: only /nano
  if (!text) {
    return bot.sendMessage(
      chatId,
      `${prompt}\n\n📌 *Example:* /nanoai What is a function in Python?`,
      { parse_mode: "Markdown" }
    );
  }

  // Case 2: user provided text
  try {
    const aiUrl = `https://api-rebix.vercel.app/api/gptlogic?q=${encodeURIComponent(
      text
    )}&prompt=${encodeURIComponent(prompt)}`;

    const res = await fetch(aiUrl);
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);

    const data = await res.json();
    const replyText = data.response || "⚠️ No response from AI.";

    // Split long responses safely
    const chunks = splitMessage(replyText);
    for (const chunk of chunks) {
      await bot.sendMessage(chatId, chunk);
    }
  } catch (err) {
    bot.sendMessage(chatId, `❌ An error occurred: ${err.message}`);
  }
});


// ==================== /mystats ====================

// ===== /myinfo command =====
registerCommand(/\/mystats/, "Show your profile stats", (msg) => {
  const userId = msg.from.id.toString();
  const user = users[userId];

  if (!user) {
    return bot.sendMessage(
      msg.chat.id,
      "❌ You are not registered yet. Use /start to begin."
    );
  }

  // Leaderboard rank
  const sortedUsers = Object.values(users).sort((a, b) => (b.coins || 0) - (a.coins || 0));
  const rank = sortedUsers.findIndex(u => u.telegramId === userId || u.id === userId) + 1;

  // Premium status (fix: align with /buypremium storage)
  let premiumStatus = "❌ Not Premium";
  if (user.premium && user.premium.isPremium && Date.now() < user.premium.expiresAt) {
    const daysLeft = Math.ceil((user.premium.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    premiumStatus = `💎 Premium (${daysLeft} day${daysLeft > 1 ? "s" : ""} left)`;
  }

  // Badges
  const badgeList = (user.badges && user.badges.length > 0) ? user.badges.join(" ") : "None";

  const infoMsg = `
<b>📜 Your Info</b>
👤 Name: <b>${escapeHTML(user.name || user.displayName || "Unknown")}</b>
💬 Username: @${user.username || "No username"}
💰 Coins: <b>${user.coins || 0}</b>
📅 Joined: <b>${user.joinDate ? new Date(user.joinDate).toDateString() : "Unknown"}</b>
🔥 Daily Streak: <b>${user.usageCount || 0}</b> days
🏆 Leaderboard Rank: <b>#${rank}</b>
${premiumStatus}
🎖 Badges: ${badgeList}
`;

  bot.sendMessage(msg.chat.id, infoMsg, { parse_mode: "HTML" });
});


// ===== /reset command =====
registerCommand(/\/reset/, "Reset your current course progress", (msg) => {
  const chatId = msg.chat.id;

  if (!userProgress[chatId]) {
    return bot.sendMessage(chatId, "❗ You haven't started any course yet.");
  }

  const topic = userProgress[chatId].topic;

  // Premium restriction
  if (premiumTopics.includes(topic) && !requirePremium(chatId, msg.from.id)) {
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
registerCommand(/\/run\s+js(?:\s+([\s\S]+))?/, "Run JavaScript code", async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];

  if (!code) {
    return bot.sendMessage(chatId, "❗ Usage: /run js <your JavaScript code>");
  }

  try {
    let output = "";
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      output += args.join(" ") + "\n";
    };

    let result = eval(code); // ⚠️ risky, sandboxing recommended

    console.log = originalConsoleLog;

    if (result !== undefined && result !== null) {
      output += result.toString();
    }

    if (!output.trim()) output = "No output";

    await bot.sendMessage(chatId, `<pre>${escapeHTML(output)}</pre>`, { parse_mode: "HTML" });
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Error: <b>${escapeHTML(e.message)}</b>`, { parse_mode: "HTML" });
  }
});


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
    id: 'prime-check',
    title: 'Prime Number Check',
    description: 'Given an integer n, print "YES" if it is prime, otherwise "NO".',
    input: '7',
    expected_output: 'YES',
  },
  {
    id: 'fibonacci',
    title: 'Nth Fibonacci',
    description: 'Given n, print the nth Fibonacci number (0-indexed).',
    input: '7',
    expected_output: '13',
  },
  {
    id: 'js-scope',
    title: 'JavaScript Scope',
    description: 'What will this code output?\n\n```js\nlet a = 10;\n{\n  let a = 20;\n  console.log(a);\n}\nconsole.log(a);\n```',
    input: '',
    expected_output: '20\n10',
  },
  {
    id: 'python-loop',
    title: 'Python Loop Output',
    description: 'What will this code print?\n\n```python\nfor i in range(3):\n    print(i * "*")\n```',
    input: '',
    expected_output: '\n\n*\n**',
  },
  {
    id: 'reverse-words',
    title: 'Reverse Words',
    description: 'Given a sentence, reverse the order of words.',
    input: 'I love coding',
    expected_output: 'coding love I',
  },
  {
    id: 'factorial',
    title: 'Factorial',
    description: 'Read an integer n and print n!.',
    input: '5',
    expected_output: '120',
  },
  {
    id: 'sql-query',
    title: 'SQL Basics',
    description: 'Write an SQL query to select all users with age > 18 from table `users`.',
    input: '',
    expected_output: 'SELECT * FROM users WHERE age > 18;',
  },
  {
    id: 'trivia-closure',
    title: 'JavaScript Closures',
    description: 'What is a closure in JavaScript?',
    input: '',
    expected_output: 'A closure is a function that remembers its lexical scope even when executed outside of it.',
  },
  {
    id: 'trivia-bigO',
    title: 'Algorithm Complexity',
    description: 'What is the time complexity of binary search?',
    input: '',
    expected_output: 'O(log n)',
  },
  {
    id: 'output-js',
    title: 'Predict Output',
    description: 'What will this output?\n\n```js\nconsole.log(typeof NaN);\n```',
    input: '',
    expected_output: 'number',
  },
  {
    id: 'output-python',
    title: 'Predict Python Output',
    description: 'What will this print?\n\n```python\nprint("5" * 3)\n```',
    input: '',
    expected_output: '555',
  },
  {
    id: 'anagram',
    title: 'Check Anagram',
    description: 'Given two strings, print "YES" if they are anagrams, otherwise "NO".',
    input: 'listen silent',
    expected_output: 'YES',
  },
  {
    id: 'palindrome',
    title: 'Palindrome Check',
    description: 'Read a string and print "YES" if it is a palindrome, otherwise "NO".',
    input: 'racecar',
    expected_output: 'YES',
  },
  {
    id: 'capitalize',
    title: 'Capitalize Words',
    description: 'Given a sentence, capitalize the first letter of each word.',
    input: 'hello world',
    expected_output: 'Hello World',
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
function broadcastNewRooms() {
  const data = readBattles();

  // Filter battles not broadcasted yet and with no password (assuming no password for now)
  const newRooms = data.battles.filter(battle => !battle.broadcasted);

  if (newRooms.length === 0) return;

  const message = newRooms
    .map(
      (room) =>
        `Room: ${room.code}\nHost: ${room.host}\nProblem: ${room.problem.title}\nPlayers: ${Object.keys(room.players).length}\nEnds in: ${Math.ceil(
          (room.endsAt - Date.now()) / 60000
        )} min`
    )
    .join('\n\n');

  // Broadcast to all users
  Object.keys(users).forEach((chatId) => {
    bot.sendMessage(chatId, `📢 New Battle Rooms Open:\n\n${message}`);
  });

  // Mark these rooms as broadcasted
  newRooms.forEach((room) => {
    room.broadcasted = true;
  });

  // Save battles.json after updating broadcasted flag
  writeBattles(data);
}

// /battle start command
registerCommand(/\/battle create(?:\s+(\S+))?$/, "Start a new battle (optionally password-protected)", (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name || "Unknown";

  const password = match[1] || ""; // optional password: /battle start mypass

  const data = readBattles();

  // ensure no duplicate active battles from the same user
  const existing = data.battles.find(b => b.host === userId && b.status === "waiting");
  if (existing) {
    return bot.sendMessage(chatId, `⚠️ You already have a waiting battle with code <b>${existing.code}</b>.`, { parse_mode: "HTML" });
  }

  // pick random problem
  const problem = battleProblems[Math.floor(Math.random() * battleProblems.length)];

  const code = genRoomCode();
  const durationMs = 5 * 60 * 1000; // default 5 minutes

  const battle = {
    code,
    host: userId,
    password,
    problem,
    createdAt: Date.now(),
    endsAt: Date.now() + durationMs,
    status: "waiting", // waiting | running | finished
    players: {
      [userId]: {
        id: userId,
        name: username,
        submitted: false,
        solved: false,
        time: null
      }
    },
    submissions: []
  };

  data.battles.push(battle);
  writeBattles(data);

  bot.sendMessage(
    chatId,
    `🎯 <b>Battle Created!</b>\n\n` +
    `📌 Code: <b>${code}</b>\n` +
    `${password ? "🔒 Password Protected" : "🔓 Open Room"}\n` +
    `📖 Question: <b>${problem.title}</b>\n` +
    `⏱ Duration: 5 minutes\n\n` +
    `👥 To join: <code>/battle join ${code}${password ? " " + password : ""}</code>\n` +
    `▶️ When ready, host or any player can start with <code>/battle startgame ${code}</code>`,
    { parse_mode: "HTML" }
  );

  // notify global room list
  broadcastNewRooms();
});

registerCommand(
  /^\/help$/,
  "Show all available commands",
  (msg) => {
    try {
      const chatId = msg.chat.id;
      const helpText = commands
        .map(cmd => {
          try {
            const match = cmd.regex?.toString().match(/\/\w+/);
            return match ? `- ${match[0]} → ${cmd.description}` : null;
          } catch (e) {
            console.error("Error parsing command:", cmd, e);
            return null;
          }
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



// Join battle room (limit 10 max)
registerCommand(/\/battle join (\S+)(?:\s+(\S+))?$/, "Join a battle room", (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name || "Unknown";

  const code = match[1];
  const passwordAttempt = match[2] || "";

  const data = readBattles();
  const battle = data.battles.find(b => b.code === code);

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

  if (battle.players[userId]) {
    return bot.sendMessage(chatId, `❌ You already joined room <b>${code}</b>.`, { parse_mode: "HTML" });
  }

  battle.players[userId] = {
    id: userId,
    name: username,
    submitted: false,
    solved: false,
    time: null
  };

  writeBattles(data);

  bot.sendMessage(chatId, `✅ You joined the battle room <b>${code}</b>!`, { parse_mode: "HTML" });

  // notify host (if not the same user)
  if (battle.host !== userId) {
    bot.sendMessage(battle.host, `👤 ${username} joined your battle <b>${code}</b>.`, { parse_mode: "HTML" });
  }
});


const PREMIUM_GROUP_ID = -1002984807954;
const PREMIUM_GROUP_LINK = "https://t.me/TrustBitCoding"; // generated invite link



function buyPremium(bot, chatId, days) {
  const coins = loadJSON(coinsFile);
  const premiumUsers = loadJSON(premiumFile);

  const cost = 100 * days;
  if ((coins[chatId] || 0) < cost) {
    return bot.sendMessage(chatId, "❌ Not enough coins.");
  }

  coins[chatId] -= cost;
  saveJSON(coinsFile, coins);

  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  premiumUsers[chatId] = expiry;
  saveJSON(premiumFile, premiumUsers);

  bot.sendMessage(chatId, `🎉 Premium activated for ${days} days!`);
  bot.sendMessage(chatId, `🔗 Join the Premium Group: ${PREMIUM_GROUP_LINK}`);

  // Optional: Send premium welcome message with privileges
  sendPremiumWelcome(bot, chatId, users[chatId]?.name || "User");
}

// Start periodic premium expiry checks every 10 minutes
setInterval(() => checkPremiumExpiry(bot), 60 * 60 * 1000);
 // every 10 minutes

const quizTask = require("./quiz_and_task");

// Quiz commands
registerCommand(/\/quizmode$/, "Start interactive quiz mode", (msg) => {
  const chatId = msg.chat.id;

  try {
    quizTask.startQuizMode(bot, chatId);
    bot.sendMessage(chatId, "📝 Quiz mode activated! Answer the questions as they come in.");
  } catch (err) {
    console.error("QuizMode Error:", err);
    bot.sendMessage(chatId, "❌ Failed to start quiz mode. Please try again later.");
  }
});

registerCommand(/\/stopquiz$/, "Stop quiz mode", (msg) => {
  const chatId = msg.chat.id;

  try {
    quizTask.stopQuizMode(bot, chatId);
    bot.sendMessage(chatId, "🛑 Quiz mode stopped. You can start again with /quizmode anytime.");
  } catch (err) {
    console.error("StopQuiz Error:", err);
    bot.sendMessage(chatId, "❌ Failed to stop quiz mode. Please try again.");
  }
});

bot.on("message", (msg) => {
  // Ignore messages that are commands (start with "/")
  if (msg.text && msg.text.startsWith("/")) return;

  try {
    quizTask.handleQuizAnswer(bot, msg);
  } catch (err) {
    console.error("Quiz answer error:", err);
    bot.sendMessage(msg.chat.id, "❌ Error processing your quiz answer.");
  }
});


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


// Admin give coins // your Telegram ID

// Admin gives coins

const usersFile = './users.json';
const coinsFile = './coins.json';

/*function loadJSON(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
}*/
/*function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}*/


function getBotUserId(telegramId) {
  return users[telegramId]?.id || null;
}

registerCommand(/\/myid$/, "Show your bot ID", (msg) => {
  const chatId = msg.chat.id;
  const botId = getBotUserId(chatId);

  if (!botId) {
    return bot.sendMessage(chatId, "❌ Could not retrieve your bot ID. Try again later.");
  }

  bot.sendMessage(chatId, `🆔 Your bot ID is: <b>${botId}</b>`, { parse_mode: "HTML" });
});


// Give coins by bot ID

// /giftcoins <userID> <amount>
// ======= Simple safe /giftcoins handler (no registerCommand) =======
const ADMIN_IDS = new Set(["6499793556"]); // put your admin Telegram IDs here (strings or numbers)

// helper to check admin
function isAdmin(id) {
  return ADMIN_IDS.has(String(id)) || ADMIN_IDS.has(Number(id));
}

// Listen directly (no registerCommand wrapper)
/*bot.onText(/^\/giftcoins(?:@\w+)?\s+(\S+)\s+(\d+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  try {
    const senderId = msg.from.id;
    // 1) admin check
    if (!isAdmin(senderId)) {
      console.log(`/giftcoin attempt by non-admin: ${senderId}`);
      return bot.sendMessage(chatId, "🚫 You are not authorized to use this command.");
    }

    // 2) parse args
    const userIdInput = match[1].trim(); // could be bot-generated id or @username
    const amount = parseInt(match[2], 10);
    if (isNaN(amount) || amount <= 0) {
      return bot.sendMessage(chatId, "⚠️ Please provide a valid positive amount. Example: /giftcoin USERID 100");
    }

    // 3) find target user (support numeric bot-id OR @username)
    let targetKey = null;
    for (const key of Object.keys(users || {})) {
      const u = users[key];
      // match by stored numeric id
      if (String(u.id) === String(userIdInput)) {
        targetKey = key;
        break;
      }
      // match by username (allow input "@name" or "name")
      const plainInput = userIdInput.startsWith("@") ? userIdInput.slice(1) : userIdInput;
      if (u.username && u.username.toLowerCase() === plainInput.toLowerCase()) {
        targetKey = key;
        break;
      }
      // also accept when user's telegram id (key) equals input
      if (String(key) === String(userIdInput)) {
        targetKey = key;
        break;
      }
    }

    if (!targetKey) {
      return bot.sendMessage(chatId, `❌ No user found with ID/username: ${userIdInput}`);
    }

    // 4) update coins and persist
    users[targetKey].coins = (users[targetKey].coins || 0) + amount;

    try {
      // saveUsers() in your code is probably synchronous; if it's async, await it
      if (typeof saveUsers === "function") {
        const saved = saveUsers(); // keep same call as in your codebase
        if (saved && saved.then) await saved;
      }
    } catch (e) {
      console.error("Error saving users after gifting:", e);
      // continue — we still updated in memory
    }

    const display = users[targetKey].displayName || users[targetKey].username || `ID:${users[targetKey].id}`;
    const newBalance = users[targetKey].coins;

    console.log(`/giftcoins: admin ${senderId} gave ${amount} to ${display}`);

    return bot.sendMessage(
      chatId,
      `✅ Gifted ${amount} coins to ${display} (ID: ${users[targetKey].id}).\nNew balance: ${newBalance} coins.`
    );
  } catch (err) {
    console.error("Error in /giftcoins handler:", err);
    return bot.sendMessage(chatId, "❌ An error occurred while processing the command. Check the bot logs.");
  }
});*/

// ===== GIFT COINS (Admin only) =====
registerCommand(
  /^\/giftcoin\s+(\w+)\s+(\d+)$/,   // ✅ regex must start ^ and end $
  "Gift coins to a user (admin only)",  // ✅ description
  (msg, match) => {                    // ✅ handler (function)

    const chatId = msg.chat.id.toString();
    const adminIds = ["6499793556"]; // your Telegram ID(s) as admin
    const userIdInput = match[1].trim(); // bot-generated user ID
    const amount = parseInt(match[2], 10);

    // 🔒 Check admin permission
    if (!adminIds.includes(msg.from.id.toString())) {
      return bot.sendMessage(chatId, "🚫 You are not authorized to use this command.");
    }

    if (isNaN(amount) || amount <= 0) {
      return bot.sendMessage(chatId, "⚠️ Please provide a valid positive amount.");
    }

    // 🔍 Find user by stored bot-generated ID
    let targetUserKey = null;
    for (const tgId in users) {
      if (String(users[tgId].id) === userIdInput) {
        targetUserKey = tgId;
        break;
      }
    }

    if (!targetUserKey) {
      return bot.sendMessage(
        chatId,
        `❌ No user found with ID: <b>${userIdInput}</b>`,
        { parse_mode: "HTML" }
      );
    }

    // 💰 Update coins
    const targetUser = users[targetUserKey];
    targetUser.coins = (targetUser.coins || 0) + amount;

    saveUsers();

    bot.sendMessage(
      chatId,
      `✅ Gifted <b>${amount}</b> coins to <b>${escapeHTML(targetUser.displayName || "Unknown")}</b> (ID: <code>${targetUser.id}</code>).\n` +
      `💰 New Balance: <b>${targetUser.coins}</b> coins.`,
      { parse_mode: "HTML" }
    );
  }
);

// ===== BUY PREMIUM =====
const premiumGroupLink = "https://t.me/TrustBitCoding"; // Set your group invite link
const premiumCostPerDay = 50; // Example: 50 coins per day

registerCommand(
  /\/buypremium\s+(\d+)$/,
  "Buy premium for given days",
  (msg, match) => {
    const chatId = msg.chat.id;
    const days = parseInt(match[1], 10);
    const userId = msg.from.id.toString();
    const user = users[userId];

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

    user.premium = {
      isPremium: true,
      expiresAt: expireTime,
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
);



registerCommand(/^\/premiumstatus$/, "Check your premium subscription status", (msg) => {
  const chatId = msg.chat.id;
  const user = users[msg.from.id];

  if (!user) {
    return bot.sendMessage(chatId, "❌ You are not registered. Use /start to register first.");
  }

  if (!user.premium || !user.premium.isPremium) {
    return bot.sendMessage(
      chatId,
      "⚠️ You don't have an active Premium subscription.\n\nUse /buypremium <days> to upgrade."
    );
  }

  const now = Date.now();
  if (now > user.premium.expiresAt) {
    user.premium.isPremium = false;
    saveUsers();
    return bot.sendMessage(
      chatId,
      "⏳ Your Premium subscription has expired.\n\nUse /buypremium <days> to renew."
    );
  }

  const remainingMs = user.premium.expiresAt - now;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  bot.sendMessage(
    chatId,
    `✨ <b>Premium Status</b>\n\n` +
    `✅ Active: <b>Yes</b>\n` +
    `📅 Expires on: <b>${new Date(user.premium.expiresAt).toDateString()}</b>\n` +
    `⏳ Days remaining: <b>${remainingDays}</b>`,
    { parse_mode: "HTML" }
  );
});



// ===== DAILY PREMIUM CHECK =====
setInterval(() => {
    const now = Date.now();

    Object.values(users).forEach(user => {
        if (user.premium?.isPremium && user.premium.expiresAt < now) {
            user.premium.isPremium = false;
            user.premium.expiresAt = null;

            // Remove badge
            user.badge = null;

            // Optionally remove from TG group (bot must be admin in that group)
            bot.kickChatMember("-100YOUR_GROUP_ID", user.telegramId)
                .catch(err => console.log(`Failed to remove user ${user.telegramId}:`, err));

            saveUsers();
        }
    });
}, 60 * 60 * 1000); // Runs every 1 hour



// Check premium expiry every hour
setInterval(() => quizTask.checkPremiumExpiry(bot), 60 * 60 * 1000);


// Start battle game (host or any player) — need minimum 2 players
registerCommand(/^\/battle startgame(?: (\w{5,6}))?$/i, "Start a battle game with the provided room code", (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1] ? match[1].trim().toUpperCase() : null;

  if (!code) {
    return bot.sendMessage(chatId, '⚠️ Please provide the 6-letter Battle Room Code.\nUsage: /battle startgame ROOMCODE');
  }

  // Load battle data
  const data = readBattles();
  if (!data || !Array.isArray(data.battles)) {
    return bot.sendMessage(chatId, '❌ Error loading battles.');
  }

  // Find battle (case-insensitive)
  const battle = data.battles.find((b) => String(b.code).trim().toUpperCase() === code);

  if (!battle) {
    console.log("Battles loaded:", data.battles); // debug
    return bot.sendMessage(chatId, '❌ Battle not found.');
  }

  if (battle.status === 'running') return bot.sendMessage(chatId, '⚠️ Battle already running.');
  if (battle.status === 'finished') return bot.sendMessage(chatId, '⚠️ Battle already finished.');

  if (Object.keys(battle.players).length < 2) {
    return bot.sendMessage(chatId, '❌ Need at least 2 players to start.');
  }

  // Start battle
  battle.status = 'running';
  const now = Date.now();
  battle.endsAt = now + (battle.durationMs || 10 * 60 * 1000); // default 10 mins

  writeBattles(data);

  // Notify players privately
  Object.values(battle.players).forEach((p) => {
    bot.sendMessage(
      p.id,
      `🏁 <b>Battle started!</b>\n` +
      `🔑 Room: <b>${code}</b>\n` +
      `📌 Problem: <b>${battle.problem.title}</b>\n\n` +
      `${battle.problem.description}\n\n` +
      `➡️ Submit your answer with:\n<code>/battle submit ${code} &lt;your-output&gt;</code>\n\n` +
      `⏳ Time remaining: <b>${Math.ceil((battle.endsAt - now) / 1000)} seconds</b>.`,
      { parse_mode: 'HTML' }
    ).catch(() => {}); // ignore DM errors
  });

  // Announce in group
  bot.sendMessage(
    chatId,
    `🏁 <b>Battle started!</b>\n` +
    `🔑 Room: <b>${code}</b>\n` +
    `📌 Problem: <b>${battle.problem.title}</b>\n\n` +
    `🔥 Good luck to all players!`,
    { parse_mode: 'HTML' }
  );

  // Schedule end
  setTimeout(() => {
    const d = readBattles();
    const b = d.battles.find((x) => String(x.code).trim().toUpperCase() === code);
    if (!b || b.status === 'finished') return;

    b.status = 'finished';

    // Update leaderboard
    const leaderboard = readLeaderboard();
    Object.values(b.players).forEach((p) => {
      if (p.solved) leaderboard.scores[p.id] = (leaderboard.scores[p.id] || 0) + 10;
    });

    writeLeaderboard(leaderboard);
    writeBattles(d);

    // Announce results
    bot.sendMessage(
      chatId,
      `⏹️ <b>Battle ${code} ended!</b>\n\n` +
      Object.values(b.players)
        .map((p) => `👤 ${p.name} — ${p.solved ? '✅ Solved' : '❌ Not solved'}`)
        .join('\n'),
      { parse_mode: 'HTML' }
    );
  }, battle.endsAt - now);
});


registerCommand(
  /^\/battle setsettings (\w{5,6}) (\d+)(?:m|M|min|MIN)? (\d+)(?:q|Q)?(?: (\d+)(?:s|S|sec|SEC)?)?$/,
  "Set battle settings (admin only): duration, question count, per-question time",
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
    if (battle.adminId !== userId) return bot.sendMessage(chatId, "🚫 Only the battle admin can change settings.");
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
    if (perQuestionSeconds !== null) {
      battle.perQuestionTimeSec = perQuestionSeconds;
    }

    writeBattles(data);

    bot.sendMessage(
      chatId,
      `✅ <b>Settings updated for Battle ${code}</b>\n\n` +
      `🕒 Duration: <b>${durationMinutes} minute(s)</b>\n` +
      `❓ Questions: <b>${questionCount}</b>\n` +
      (perQuestionSeconds ? `⏳ Per Question Time: <b>${perQuestionSeconds} seconds</b>` : ""),
      { parse_mode: "HTML" }
    );
  }
);


// Submit solution with improved error handling
registerCommand(
  /\/battle submit (\w{5}) (.+)/,
  "Submit your solution output for a battle problem",
  (msg, match) => {
    const chatId = msg.chat.id;
    const code = match[1].toUpperCase();
    let output = match[2].trim();

    try {
      const data = readBattles();
      const battle = data.battles.find((b) => b.code === code);

      if (!battle) return bot.sendMessage(chatId, "❌ Battle not found.");
      if (battle.status !== "running") return bot.sendMessage(chatId, "⚠️ Battle is not running.");

      const uid = msg.from.id;
      if (!battle.players[uid]) {
        return bot.sendMessage(
          chatId,
          `🚫 You are not in this battle.\nJoin with <code>/battle join ${code}</code>`,
          { parse_mode: "HTML" }
        );
      }

      // Normalize whitespace
      output = output.replace(/\s+/g, " ").trim();
      const expected = String(battle.problem.expected_output).replace(/\s+/g, " ").trim();

      const now = Date.now();
      const timeTaken = now - (battle.createdAt || battle.endsAt || battle.createdAt);

      if (output === expected) {
        battle.players[uid].submitted = true;

        if (!battle.players[uid].solved) {
          battle.players[uid].solved = true;
          battle.players[uid].time = timeTaken;
          battle.submissions.push({ user: uid, ok: true, time: timeTaken });

          // Award points
          const leaderboard = readLeaderboard();
          leaderboard.scores[uid] = (leaderboard.scores[uid] || 0) + 10;
          writeLeaderboard(leaderboard);
          writeBattles(data);

          return bot.sendMessage(
            chatId,
            `✅ <b>Correct!</b>\n${msg.from.username || msg.from.first_name} solved it.\n+10 points awarded.`,
            { parse_mode: "HTML" }
          );
        } else {
          return bot.sendMessage(chatId, "ℹ️ You already solved this one.");
        }
      } else {
        // Incorrect
        battle.submissions.push({ user: uid, ok: false, got: output, time: now });
        writeBattles(data);

        return bot.sendMessage(chatId, "❌ Incorrect output. Try again!");
      }
    } catch (err) {
      console.error("Error in /battle submit:", err);
      return bot.sendMessage(chatId, "❌ An error occurred while processing your submission.");
    }
  }
);

registerCommand(
  /\/battle delete (\S+)/,
  "Delete a battle room (admin only)",
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
registerCommand(
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
);


// Leave battle
registerCommand(
  /\/battle leave (\S+)/,
  "Leave a battle room",
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
  "Check the status of a battle",
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
  "Show remaining time in a battle",        // description (string)
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



// Leaderboard
registerCommand(
  /\/leaderboard$/,                               // regex
  "Show the top 30 players leaderboard",          // description
  (msg) => {                                      // handler
    const chatId = msg.chat.id;

    // Sort users by points descending
    const sortedUsers = Object.values(users)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 30);

    if (sortedUsers.length === 0) {
      return bot.sendMessage(chatId, "🏆 Leaderboard is empty.");
    }

    const leaderboardText = sortedUsers
      .map((user, index) => {
        const displayName =
          user.username ? `@${user.username}` :
          user.first_name ? user.first_name :
          `ID:${user.id}`;

        return `${index + 1}. <b>${displayName}</b> — ${user.points || 0} pts`;
      })
      .join("\n");

    bot.sendMessage(
      chatId,
      `<b>🏆 Top 30 Players</b>\n\n${leaderboardText}`,
      { parse_mode: "HTML" }
    );
  }
);


// admins stats
const ADMIN = ['6499793556']; // your Telegram user IDs

bot.onText(/\/stats$/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // better to check admin by sender

  if (!ADMIN.includes(userId)) {
    return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
  }

  const users = readJSON('./users.json') || {};
  const battles = readJSON('./battles.json') || { battles: [] };

  const totalUsers = Object.keys(users).length;
  const onlineUsers = Object.values(users).filter(
    u => (Date.now() - (u.lastActive || 0)) < 10 * 60 * 1000
  ).length;
  const activeRooms = battles.battles.length;

  // Top 5 players
  const topPlayers = Object.values(users)
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5)
    .map((u, i) => {
      const displayName =
        u.username ? `@${u.username}` :
        u.first_name ? u.first_name :
        `ID:${u.id}`;
      return `${i + 1}. <b>${displayName}</b> — ${u.points || 0} pts`;
    })
    .join('\n') || "No players yet.";

  const statsMsg = `
📊 <b>Bot Stats</b>
━━━━━━━━━━━━━━
👥 Total users: <b>${totalUsers}</b>
🟢 Online users (10m): <b>${onlineUsers}</b>
🎮 Active rooms: <b>${activeRooms}</b>

🏆 <b>Top 5 Players</b>
${topPlayers}
  `;

  bot.sendMessage(chatId, statsMsg, { parse_mode: "HTML" });
});

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// /motivate
registerCommand(
  /\/motivate$/,                          // regex
  "Send a random motivational quote",     // description
  (msg) => {                              // handler
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!users[userId]) {
      return bot.sendMessage(
        chatId,
        "❌ You are not registered yet. Use /start to begin."
      );
    }

    bot.sendMessage(chatId, getRandomItem(motivationalQuotes));
  }
);


// /funfact
registerCommand(
  /\/funfact$/,                        // regex
  "Send a random fun fact",            // description
  (msg) => {                           // handler
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!users[userId]) {
      return bot.sendMessage(
        chatId,
        "❌ You are not registered yet. Use /start to begin."
      );
    }

    bot.sendMessage(chatId, getRandomItem(funFacts));
  }
);


// /roastcode
registerCommand(
  /\/roastcode$/,                     // regex
  "Send a random code roast",         // description
  (msg) => {                          // handler
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (!users[userId]) {
      return bot.sendMessage(
        chatId,
        "❌ You are not registered yet. Use /start to begin."
      );
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

const awardedCoupons = readJSON('./coupons.json'); // save awarded coupons history
registerCommand(
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
);

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


// List of admin user IDs (your Telegram user IDs)
const adminUserIds = [6499793556];

// Command to send announcement
registerCommand(/\/announce (.+)/,
  "announce to everyone",
   (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const announcement = match[1].trim();

  if (!adminUserIds.includes(userId)) {
    return bot.sendMessage(chatId, "❌ You don't have permission to send announcements.");
  }

  // Broadcast announcement to all users
  Object.keys(users).forEach(uId => {
    addMailToUser(uId, {
      from: 'admin',
      subject: 'Announcement',
      body: announcement,
    });
  });

  bot.sendMessage(chatId, "✅ Announcement sent to all users.");
});



// 📬 Inbox command
registerCommand(
  /\/inbox$/,
  "Show your inbox messages",
  (msg) => {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;

    const mailboxes = readMailboxes();
    const mails = mailboxes[userId] || [];

    if (mails.length === 0) {
      return bot.sendMessage(chatId, "📭 Your inbox is empty.");
    }

    // List mails with index, subject, and read status
    const listText = mails
      .map(
        (mail, i) =>
          `${i + 1}. ${mail.read ? "✅" : "📩"} ${mail.subject} (Received: ${new Date(mail.timestamp).toLocaleString()})`
      )
      .join("\n");

    bot.sendMessage(
  chatId,
  `📬 <b>Your Messages:</b>\n\n${listText}\n\nUse /read <b>number</b> to read a message.`,
  { parse_mode: "HTML" }
);

  }
);

// 📖 Read message command
registerCommand(
  /\/read (\d+)/,
  "Read a message from your inbox",
  (msg, match) => {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const index = parseInt(match[1], 10) - 1;

    const mailboxes = readMailboxes();
    const mails = mailboxes[userId] || [];

    if (!mails[index]) {
      return bot.sendMessage(chatId, "❌ Invalid message number.");
    }

    const mail = mails[index];
    mail.read = true;
    writeMailboxes(mailboxes);

    bot.sendMessage(
      chatId,
      `📩 <b>${mail.subject}</b>\nFrom: ${mail.from}\nReceived: ${new Date(mail.timestamp).toLocaleString()}\n\n${mail.body}`,
      { parse_mode: "HTML" }
    );
  }
);



// 🗑️ Delete a message
registerCommand(
  /\/delete (\d+)/,
  "Delete a message from your inbox",
  (msg, match) => {
    const userId = msg.from.id.toString();
    const chatId = msg.chat.id;
    const index = parseInt(match[1], 10) - 1;

    const mailboxes = readMailboxes();
    const mails = mailboxes[userId] || [];

    if (!mails[index]) {
      return bot.sendMessage(chatId, "❌ Invalid message number.");
    }

    mails.splice(index, 1);
    writeMailboxes(mailboxes);

    bot.sendMessage(chatId, "🗑️ Message deleted.");
  }
);

// 🎁 Mystery box
registerCommand(
  /\/mysterybox/,
  "Open your daily mystery box (coins, premium, or badge!)",
  (msg) => {
    const userId = msg.from.id.toString();
    const now = Date.now();

    if (!users[userId]) {
      return bot.sendMessage(msg.chat.id, "❌ You are not registered. Use /start first.");
    }

    if (users[userId].lastMysteryBox && now - users[userId].lastMysteryBox < 24 * 60 * 60 * 1000) {
      return bot.sendMessage(msg.chat.id, "📦 You already opened your mystery box today. Come back tomorrow!");
    }

    let rewardText;
    const isPremium = users[userId].isPremium && users[userId].premiumExpires > now;
    const chance = Math.random();

    if (chance < (isPremium ? 0.05 : 0.01)) {
      users[userId].premiumExpires = (users[userId].premiumExpires || now) + 24 * 60 * 60 * 1000;
      users[userId].isPremium = true;
      rewardText = "🎁 You won +1 day Premium!";
    } else if (chance < (isPremium ? 0.20 : 0.10)) {
      const coins = Math.floor(Math.random() * 90) + 10;
      users[userId].coins += coins;
      rewardText = `💰 You found ${coins} coins!`;
    } else {
      users[userId].badgeExpires = now + 24 * 60 * 60 * 1000;
      users[userId].badge = "🏅";
      rewardText = "🏅 You got a 24h special badge!";
    }

    users[userId].lastMysteryBox = now;
    saveUsers();

    bot.sendMessage(msg.chat.id, rewardText);
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

/*registerCommand(
  /\/codebattle (@\w+)/,
  "Challenge another user to a code battle",
  (msg, match) => {
    const challengerId = msg.from.id.toString();
    const opponentUsername = match[1].replace("@", "");
    const opponent = Object.values(users).find(u => u.username === opponentUsername);

    if (!opponent) {
      return bot.sendMessage(msg.chat.id, "❌ Opponent not found.");
    }

    const opponentId = opponent.id.toString();
    const battleId = `${challengerId}_${opponentId}_${Date.now()}`;

    activeBattles[battleId] = {
      challenger: challengerId,
      opponent: opponentId,
      scores: { [challengerId]: 0, [opponentId]: 0 },
      questionIndex: 0
    };

    bot.sendMessage(
      msg.chat.id,
      `⚔ Battle started between ${msg.from.first_name} and @${opponentUsername}!\nYou will receive questions in DM.`
    );

    // DM the opponent
    bot.sendMessage(opponentId, `⚔ You have been challenged to a code battle by ${msg.from.first_name}!`);
  }
);*/



// ===== Leaderboard system (top 30 + weekly) =====
const LB_PATH = './leaderboard_data.json';

// Data model saved in leaderboard_data.json:
// {
//   users: { <userId>: { username, mainPoints, weeklyPoints, gamesPlayed, wins, losses, premiumExpiry (ms) || null, lastWeekRank || null } },
//   lastWeeklySnapshot: { <userId>: rank, ... },
//   lastWeeklyResetAt: <timestamp>
// }

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
function ensureLbUser(userId, username = 'Unknown') {
  if (!lbData.users[userId]) {
    lbData.users[userId] = {
      username: username,
      mainPoints: 0,
      weeklyPoints: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      premiumExpiry: null,
      lastWeekRank: null
    };
  } else {
    // keep username updated if changed
    lbData.users[userId].username = username || lbData.users[userId].username;
  }
}

// Public: add points (call this from your battle/game code)
function addPoints(userId, username, points = 0, { gamePlayed = true, win = false } = {}) {
  ensureLbUser(userId, username);
  const u = lbData.users[userId];
  u.mainPoints = (u.mainPoints || 0) + points;
  u.weeklyPoints = (u.weeklyPoints || 0) + points;
  if (gamePlayed) u.gamesPlayed = (u.gamesPlayed || 0) + 1;
  if (win) u.wins = (u.wins || 0) + 1;
  if (!win && gamePlayed) u.losses = (u.losses || 0) + 0; // optionally update losses
  saveLeaderboardData(lbData);
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
registerCommand(/\/leaderboard_main$/,
  "Main Leaderboard",
   (msg) => {
  const text = buildLeaderboardMessage('main', 30);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML', disable_web_page_preview: true });
});

registerCommand(/\/leaderboard_week$/,
  "Weekly Leaderboard",
   (msg) => {
  const text = buildLeaderboardMessage('weekly', 30);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML', disable_web_page_preview: true });
});


// Admin helper: snapshot weekly ranks (call on weekly reset)
function snapshotWeeklyRanksAndReset() {
  // snapshot current weekly ranks
  const weekly = getSortedUsersByWeekly();
  lbData.lastWeeklySnapshot = {};
  weekly.forEach((u, idx) => {
    lbData.lastWeeklySnapshot[u.id] = idx + 1;
  });

  // Optionally compute Best Player of Week
  const best = weekly[0];
  if (best) {
    // announce to users (or admin channel)
    const announcement = `🏆 Best Player of the Week: ${getPremiumBadge(best.premiumExpiry) || ''} <b>${escapeHTML(best.username)}</b> — ${best.weeklyPoints} pts!`;
    // broadcast to all users (use your users object to iterate)
    Object.keys(users).forEach(chatId => {
      bot.sendMessage(chatId, announcement, { parse_mode: 'HTML' }).catch(()=>{});
    });
  }

  // reset weeklyPoints for everyone
  Object.values(lbData.users).forEach(u => {
    u.weeklyPoints = 0;
    u.lastWeekRank = lbData.lastWeeklySnapshot[u.id] || null;
  });

  lbData.lastWeeklyResetAt = Date.now();
  saveLeaderboardData(lbData);
}

// Schedule weekly reset: run snapshot at a weekly interval.
// Implementation choice: run once every day at server startup check if more than 7 days since last reset.
// This avoids fragile cron/timezone issues.
function maybeRunWeeklyReset() {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (!lbData.lastWeeklyResetAt || (Date.now() - lbData.lastWeeklyResetAt) > oneWeek) {
    snapshotWeeklyRanksAndReset();
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
registerCommand(/\/myinfo$/,
  "User info",
   (msg) => {
  const userId = msg.from.id.toString();
  const u = lbData.users[userId];
  if (!u) return bot.sendMessage(msg.chat.id, "❌ You are not on the leaderboard yet.");

  const ranks = getUserRanks(userId);
  const badge = getPremiumBadge(u.premiumExpiry) || '';
  const info = `
<b>📜 Your Leaderboard Info</b>
👤 ${badge} <b>${escapeHTML(u.username || 'Unknown')}</b>
🏅 Main points: <b>${u.mainPoints || 0}</b> (Rank: ${ranks.mainRank || '—'})
🕒 Weekly points: <b>${u.weeklyPoints || 0}</b> (Rank: ${ranks.weeklyRank || '—'})
🎮 Games played: <b>${u.gamesPlayed || 0}</b>
🏆 Wins: <b>${u.wins || 0}</b>
`;

  bot.sendMessage(msg.chat.id, info, { parse_mode: 'HTML', disable_web_page_preview: true });
});


// ----------------------------
// Integration notes (where to call functions)
// ----------------------------
// 1) When awarding points in your battle submit or when awarding points elsewhere, call:
//      addPoints(userId.toString(), usernameString, pointsAmount, { gamePlayed: true, win: true/false });
//    Example inside your battle handler where you already award +10 points:
//      addPoints(String(uid), msg.from.username || msg.from.first_name || 'Player', 10, { gamePlayed: true, win: true });
//
// 2) When you add premium expiry upon purchase, call:
//      setPremium(String(userId), Date.now() + days * 24*60*60*1000);
//
// 3) If you want automatic periodic announcements of Weekly Best Player, adjust `maybeRunWeeklyReset()` behavior
//    or call `snapshotWeeklyRanksAndReset()` on your weekly cron (or admin trigger).
//
// 4) Files created: leaderboard_data.json (auto).
//
// ----------------------------
// Export some helpers if needed (attach to global or module exports)
global.leaderboard = {
  addPoints,
  setPremium,
  getSortedUsersByMain,
  getSortedUsersByWeekly,
  buildLeaderboardMessage,
  lbData
};

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
const activeCourseSessions = {};
registerCommand(/^\/premiumcourse (.+)$/i,
  "prem user course",
   (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const course = match[1].toLowerCase();

  const user = users[userId];

  // Check registration
  if (!user) {
    return bot.sendMessage(chatId, "❌ You are not registered.");
  }

  // Check premium status
  if (!user.premium || !user.premium.isPremium || user.premium.expiresAt < Date.now()) {
    return bot.sendMessage(
      chatId,
      "❌ This course is for *Premium Members Only*.\nUse /buypremium to upgrade.",
      { parse_mode: "Markdown" }
    );
  }

  // Validate course
  if (!premiumCourses[course]) {
    return bot.sendMessage(
      chatId,
      "❌ Course not found. Available premium courses: ai, blockchain, cybersecurity, insider, videos."
    );
  }

  // Build course message
  let text = `📚 *${course.toUpperCase()} Premium Course:*\n\n`;
  premiumCourses[course].forEach((lesson, i) => {
    text += `${i + 1}. *${lesson.title}*\n${lesson.content}\n\n`;
  });

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
});

bot.onText(/^\/nextprem$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const session = activeCourseSessions[userId];
    if (!session) {
        return bot.sendMessage(chatId, "⚠️ No active course. Start one with /premiumcourse <course>.");
    }

    const course = premiumCourses[session.courseKey];
    session.lessonIndex++;

    if (session.lessonIndex >= course.length) {
        return bot.sendMessage(chatId, `✅ You've finished the course "${session.courseKey}". Start another with /premiumcourse <course>.`);
    }

    sendLesson(chatId, userId);
});

function sendLesson(chatId, userId) {
    const session = activeCourseSessions[userId];
    const course = premiumCourses[session.courseKey];
    const lesson = course[session.lessonIndex];

    bot.sendMessage(chatId,
        `📚 *${lesson.title}*\n\n${lesson.content}\n\n🎥 [Video Link](${lesson.video})`,
        { parse_mode: "Markdown", disable_web_page_preview: false }
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

