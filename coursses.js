module.exports = {
  html: [
    "Lesson 1: What is HTML?\nHTML stands for HyperText Markup Language...",
    "Lesson 2: Basic Tags: <html>, <head>, <body>...",
    "Lesson 3: Headings, Paragraphs, and Links..."
  ],
  css: [
    "Lesson 1: What is CSS?\nCSS stands for Cascading Style Sheets...",
    "Lesson 2: Selectors and Properties...",
    "Lesson 3: Colors, Fonts, and Box Model..."
  ],
  js: [
    "Lesson 1: What is JavaScript?\nUsed to add interactivity to websites...",
    "Lesson 2: Variables and Data Types...",
    "Lesson 3: Functions, Loops, and Events..."
  ],
  python: [
    "Lesson 1: What is Python?\nPython is a versatile programming language...",
    "Lesson 2: Variables and Input...",
    "Lesson 3: Conditions and Loops..."
  ],
  react: [
    "Lesson 1: Intro to React\nReact is a JS library for building UI...",
    "Lesson 2: Components and JSX...",
    "Lesson 3: useState and useEffect..."
  ],
  git: [
    "Lesson 1: What is Git?\nGit is a version control system...",
    "Lesson 2: Common Commands (git init, git commit...)",
    "Lesson 3: GitHub Basics"
  ],
  node: [
    "Lesson 1: What is Node.js?\nNode is JS runtime for backend...",
    "Lesson 2: Modules and npm...",
    "Lesson 3: Creating a Simple Server"
  ],
  sql: [
    "Lesson 1: What is SQL?\nSQL is used for managing databases...",
    "Lesson 2: SELECT, INSERT, DELETE...",
    "Lesson 3: Joins and Queries"
  ],
  c: [
    "Lesson 1: What is C?\nC is a low-level programming language...",
    "Lesson 2: Variables, Datatypes, and printf...",
    "Lesson 3: Loops and Functions"
  ]
};
// ===== Admin Premium Commands =====
bot.onText(/\/addpremium (\d+)/, (msg, match) => {
  if (msg.from.id !== ADMIN_ID) return;
  const id = parseInt(match[1]);

  if (!premiumUsers.includes(id)) {
    premiumUsers.push(id);
    savePremium();
    bot.sendMessage(msg.chat.id, `✅ User ${id} added as premium.`);

    // Auto-send premium group link
    bot.sendMessage(id, 
      `🎉 <b>Welcome to Premium!</b>\n\n` +
      `You now have access to:\n` +
      `- Full Web Development Course\n` +
      `- Complete Programming Cheat Sheet\n` +
      `- VIP Telegram Group\n\n` +
      `🔗 Join the group here: https://t.me/YOUR_PREMIUM_GROUP_LINK`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );

  } else {
    bot.sendMessage(msg.chat.id, `ℹ️ User ${id} is already premium.`);
  }
});
