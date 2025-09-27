// quiz_and_task.js
const fs = require("fs");
const path = require("path");

const questions = [
  {
    question: "Which keyword declares a constant in JavaScript?",
    options: ["let", "var", "const", "define"],
    correct: 2
  },
  {
    question: "What does '===' mean in JavaScript?",
    options: ["Equal value", "Equal value and type", "Assign", "Compare loosely"],
    correct: 1
  },
  {
    question: "Which Python keyword defines a function?",
    options: ["function", "def", "lambda", "fun"],
    correct: 1
  },
  {
    question: "In HTML, which tag is used for the largest heading?",
    options: ["<h6>", "<h1>", "<heading>", "<head>"],
    correct: 1
  }
];

const tasks = [
  "Build a simple To-Do app in your favorite language.",
  "Create a function that reverses a string without using built-in functions.",
  "Fetch data from a public API and display it in a nice format.",
  "Write a program that finds the largest number in a list.",
  "Design a personal portfolio website."
];

// File paths
const scoresFile = path.join(__dirname, "quiz_scores.json");
const coinsFile = path.join(__dirname, "coins.json");
if (!fs.existsSync(scoresFile)) fs.writeFileSync(scoresFile, JSON.stringify({}));
if (!fs.existsSync(coinsFile)) fs.writeFileSync(coinsFile, JSON.stringify({}));

let quizModeSessions = {};
let quizModeIntervals = {};
let quizModeTimeouts = {};

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function sendRandomQuestion(bot, chatId) {
  const question = questions[Math.floor(Math.random() * questions.length)];
  quizModeSessions[chatId].currentQuestion = question;

  let optionsText = "";
  question.options.forEach((opt, index) => {
    optionsText += `${index + 1}. ${opt}\n`;
  });

  bot.sendMessage(
    chatId,
    `❓ ${question.question}\n\n${optionsText}\n⏳ You have 15 seconds to answer by sending the option number.`
  );
}

function startQuizMode(bot, chatId) {
  if (quizModeSessions[chatId]) {
    return bot.sendMessage(chatId, "⚠️ Quiz mode is already running.");
  }

  quizModeSessions[chatId] = { score: 0, coins: 0 };
  bot.sendMessage(chatId, "🔥 Quiz mode started! You have 15 minutes total.");

  sendRandomQuestion(bot, chatId);

  quizModeIntervals[chatId] = setInterval(() => {
    sendRandomQuestion(bot, chatId);
  }, 15000);

  // Auto-stop after 15 minutes
  quizModeTimeouts[chatId] = setTimeout(() => {
    stopQuizMode(bot, chatId, true);
  }, 15 * 60 * 1000);
}

function stopQuizMode(bot, chatId, auto = false) {
  if (!quizModeSessions[chatId]) {
    return bot.sendMessage(chatId, "⚠️ No quiz mode running.");
  }

  clearInterval(quizModeIntervals[chatId]);
  clearTimeout(quizModeTimeouts[chatId]);
  delete quizModeIntervals[chatId];
  delete quizModeTimeouts[chatId];

  const score = quizModeSessions[chatId].score;
  const coinsEarned = quizModeSessions[chatId].coins;

  // Save score
  const scores = JSON.parse(fs.readFileSync(scoresFile));
  scores[chatId] = (scores[chatId] || 0) + score;
  fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));

  // Save coins
  const coins = JSON.parse(fs.readFileSync(coinsFile));
  coins[chatId] = (coins[chatId] || 0) + coinsEarned;
  fs.writeFileSync(coinsFile, JSON.stringify(coins, null, 2));

  delete quizModeSessions[chatId];

  bot.sendMessage(
    chatId,
    `⏹ Quiz mode ${auto ? "ended (time up)" : "stopped"}.\n🏆 Final score: ${score}\n💰 Coins earned: ${coinsEarned}`
  );
}

function handleQuizAnswer(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (!quizModeSessions[chatId] || !quizModeSessions[chatId].currentQuestion) return;

  const answerIndex = parseInt(text) - 1;
  const question = quizModeSessions[chatId].currentQuestion;

  if (answerIndex === question.correct) {
    quizModeSessions[chatId].score++;
    quizModeSessions[chatId].coins += 5; // Reward coins
    bot.sendMessage(chatId, "✅ Correct! (+5 coins)");
  } else {
    bot.sendMessage(
      chatId,
      `❌ Wrong! Correct answer was: ${question.options[question.correct]}`
    );
  }

  quizModeSessions[chatId].currentQuestion = null;
}

function sendDailyTask(bot, chatId) {
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  bot.sendMessage(chatId, `📅 Daily Coding Task:\n\n${task}`);
}

function showTopScores(bot, chatId) {
  const scores = JSON.parse(fs.readFileSync(scoresFile));
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 10);

  let leaderboard = "🏆 Top Quiz Players:\n\n";
  sorted.forEach(([id, score], index) => {
    leaderboard += `${index + 1}. User ${id} — ${score} pts\n`;
  });

  bot.sendMessage(chatId, leaderboard);
}

function showCoinShop(bot, chatId) {
  const coins = JSON.parse(fs.readFileSync(coinsFile));
  const balance = coins[chatId] || 0;

  bot.sendMessage(
    chatId,
    `💰 Your Coins: ${balance}\n\n🛒 Shop:\n1. Extra Daily Task (10 coins) — /buy extra_task\n2. Premium Command Access (100 coins) — /buy premium\n3. Fun Surprise (50 coins) — /buy surprise`
  );
}

function handlePurchase(bot, chatId, item) {
  const coins = JSON.parse(fs.readFileSync(coinsFile));
  const balance = coins[chatId] || 0;

  const prices = { extra_task: 10, premium: 100, surprise: 50 };

  if (!prices[item]) return bot.sendMessage(chatId, "❌ Invalid item.");
  if (balance < prices[item]) return bot.sendMessage(chatId, "❌ Not enough coins.");

  coins[chatId] -= prices[item];
  fs.writeFileSync(coinsFile, JSON.stringify(coins, null, 2));

  bot.sendMessage(chatId, `✅ Purchase successful! You bought: ${item}`);
}

module.exports = {
  startQuizMode,
  stopQuizMode,
  handleQuizAnswer,
  sendDailyTask,
  showTopScores,
  showCoinShop,
  handlePurchase
};

