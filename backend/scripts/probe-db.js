import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testConnection = async () => {
  console.log('[Probe] Testing MongoDB Atlas connection to:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@') : 'UNDEFINED');
  const startTime = Date.now();
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    const duration = Date.now() - startTime;
    console.log(`✅ [Probe] Successfully connected to MongoDB Atlas in ${duration}ms!`);
    console.log(`[Probe] Host: ${conn.connection.host}`);
    console.log(`[Probe] Database: ${conn.connection.name}`);
    console.log(`[Probe] ReadyState: ${conn.connection.readyState}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Probe] Connection failed after ${duration}ms:`, err.message);
    process.exit(1);
  }
};

testConnection();
