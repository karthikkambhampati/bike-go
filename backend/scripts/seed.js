import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/db.js';
import Bike from '../src/models/bike.js';
import User from '../src/models/user.js';
import Booking from '../src/models/booking.js';
import Otp from '../src/models/otp.js';

// Resolve .env path relative to this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedData = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Clear out any existing documents in all collections
    console.log('[Seed] Clearing all existing collections...');
    await Bike.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});
    await Otp.deleteMany({});

    // 3. Define our starting shop inventory of bikes
    console.log('[Seed] Creating mock bikes...');
    const mockBikes = [
      {
        name: 'Super73-RX Electric Motorbike',
        type: 'Electric',
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=60',
        hourlyRate: 15.0,
        status: 'available',
        version: 0
      },
      {
        name: 'RadPower RadRunner Utility Bike',
        type: 'Electric',
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60',
        hourlyRate: 12.0,
        status: 'available',
        version: 0
      },
      {
        name: 'Specialized Allez Road Bike',
        type: 'Road',
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60',
        hourlyRate: 8.0,
        status: 'available',
        version: 0
      },
      {
        name: 'Trek Domane AL 2 Disc',
        type: 'Road',
        image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500&auto=format&fit=crop&q=60',
        hourlyRate: 10.0,
        status: 'available',
        version: 0
      }
    ];

    // 4. Save to database
    const seededBikes = await Bike.insertMany(mockBikes);
    console.log(`[Seed] Successfully seeded ${seededBikes.length} bikes.`);
    
    console.log('[Seed] Seeding process complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error seeding database: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

// Execute the function
seedData();
