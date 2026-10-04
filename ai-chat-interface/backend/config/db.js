const mongoose = require("mongoose");

async function connectDB() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/ai-chat";

  let connectionUri = uri;
  if (connectionUri.includes("<db_password>")) {
    console.warn(
      "Warning: MONGO_URI contains '<db_password>' placeholder. Falling back to local MongoDB (mongodb://127.0.0.1:27017/ai-chat)"
    );
    connectionUri = "mongodb://127.0.0.1:27017/ai-chat";
  }

  try {
    await mongoose.connect(connectionUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.warn(
      "Backend server will keep running, but database-dependent operations will fail until MongoDB is available."
    );
  }
}

module.exports = connectDB;