const mongoose = require("mongoose");

let isConnected = false;

async function connectMongo() {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI not set in environment variables");
  }

  await mongoose.connect(process.env.MONGO_URI);

  isConnected = true;
  console.log("✅ MongoDB Connected");
}

module.exports = connectMongo;
