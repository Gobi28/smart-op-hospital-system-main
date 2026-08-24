const mongoose = require("mongoose");

/**
 * Connects to MongoDB Atlas using the MONGODB_URI environment variable.
 * See server/.env
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error(
        "❌ MONGODB_URI is missing. Add it to server/.env (see .env.example)."
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;