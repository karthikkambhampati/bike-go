import Bike from '../models/bike.js';
import Booking from '../models/booking.js';

export const getBikes = async (req, res) => {
  try {
    const now = new Date();

    // 1. Auto-complete any expired active bookings and release their bikes
    const expiredBookings = await Booking.find({
      status: 'active',
      endTime: { $lte: now }
    });

    if (expiredBookings.length > 0) {
      const expiredBikeIds = expiredBookings.map((b) => b.bikeId);
      await Booking.updateMany(
        { _id: { $in: expiredBookings.map((b) => b._id) } },
        { status: 'completed', actualEndTime: now }
      );
      await Bike.updateMany(
        { _id: { $in: expiredBikeIds } },
        { status: 'available', $inc: { version: 1 } }
      );
    }

    // 2. Fetch all bikes from the database
    const bikes = await Bike.find({});

    // 3. Calculate estimated availability time
    const bikesWithAvailability = await Promise.all(
      bikes.map(async (bike) => {
        if (bike.status === 'available') {
          return {
            ...bike.toObject(),
            availableAt: null
          };
        }

        // If the bike is booked or in use, find its active future booking
        const activeBooking = await Booking.findOne({
          bikeId: bike._id,
          status: 'active',
          endTime: { $gt: now }
        }).sort({ endTime: 1 });

        let availableAt = null;
        if (activeBooking) {
          // 15-minute buffer after rental completion
          availableAt = new Date(activeBooking.endTime.getTime() + 15 * 60 * 1000);
        }

        return {
          ...bike.toObject(),
          availableAt
        };
      })
    );

    return res.status(200).json(bikesWithAvailability);
  } catch (error) {
    console.error('Error fetching bikes:', error);
    return res.status(500).json({
      message: 'Server error while fetching bikes.'
    });
  }
};
