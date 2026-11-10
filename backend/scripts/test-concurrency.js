import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/db.js';
import User from '../src/models/user.js';
import Bike from '../src/models/bike.js';
import Booking from '../src/models/booking.js';
import { createBooking } from '../src/controllers/bookingController.js';

// Resolve .env path relative to this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.body = data;
    return this;
  };
  return res;
};

const runTest = async () => {
  try {
    console.log('[Test] Connecting to database...');
    await connectDB();

    console.log('[Test] Creating mock data...');
    // Create 2 test users
    const user1 = await User.create({
      username: 'testuser1',
      email: 'test1@bikego.com',
      password: 'password123',
      phone: '1111111111',
      isVerified: true
    });

    const user2 = await User.create({
      username: 'testuser2',
      email: 'test2@bikego.com',
      password: 'password123',
      phone: '2222222222',
      isVerified: true
    });

    // Create 1 available bike
    const bike = await Bike.create({
      name: 'OCC Test Bike',
      type: 'Electric',
      image: 'https://example.com/bike.jpg',
      hourlyRate: 10,
      status: 'available',
      version: 0
    });

    console.log(`[Test] Mock bike created: ID=${bike._id}, version=${bike.version}`);

    // Set up mock requests
    const req1 = {
      body: { bikeId: bike._id, duration: 2 },
      user: { _id: user1._id }
    };
    const res1 = mockRes();

    const req2 = {
      body: { bikeId: bike._id, duration: 1 },
      user: { _id: user2._id }
    };
    const res2 = mockRes();

    console.log('[Test] Sending concurrent booking requests in parallel...');
    
    // Send both requests concurrently using Promise.all
    await Promise.all([
      createBooking(req1, res1),
      createBooking(req2, res2)
    ]);

    console.log(`\n--- Results ---`);
    console.log(`User 1 Response: Status ${res1.statusCode}`, res1.body);
    console.log(`User 2 Response: Status ${res2.statusCode}`, res2.body);
    console.log(`---------------\n`);

    // Verify results
    const successCount = (res1.statusCode === 201 ? 1 : 0) + (res2.statusCode === 201 ? 1 : 0);
    const conflictCount = (res1.statusCode === 409 ? 1 : 0) + (res2.statusCode === 409 ? 1 : 0);

    const freshBike = await Bike.findById(bike._id);
    const bookings = await Booking.find({ bikeId: bike._id });

    console.log(`[Database State] Bike status: ${freshBike.status}, version: ${freshBike.version}`);
    console.log(`[Database State] Total bookings created in database: ${bookings.length}`);

    if (successCount === 1 && conflictCount === 1 && bookings.length === 1 && freshBike.version === 1) {
      console.log('✅ TEST PASSED: Concurrency safety works! Naive double booking was prevented.');
    } else {
      console.error('❌ TEST FAILED: Concurrency safety failed. Double booking or unexpected state occurred.');
    }

    // Clean up
    console.log('\n[Test] Cleaning up database...');
    await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
    await Bike.deleteOne({ _id: bike._id });
    await Booking.deleteMany({ bikeId: bike._id });
    console.log('[Test] Cleanup complete.');

    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('[Test] Unexpected error during test:', error);
    try {
      mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
};

runTest();
