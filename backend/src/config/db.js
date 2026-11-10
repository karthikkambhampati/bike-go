import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("[Database] CRITICAL ERROR: MONGODB_URI environment variable is not defined!");
    console.error("[Database] Please configure MONGODB_URI in backend/.env or your AWS environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error("[Database] Database connection failed:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    throw err;
  }
};

export default connectDb;
