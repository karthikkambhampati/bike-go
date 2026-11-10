import Booking from '../models/booking.js';
import Bike from '../models/bike.js';

// @desc    Create a new booking (with Optimistic Concurrency Control)
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { bikeId, duration } = req.body;

    // 1. Validate inputs
    if (!bikeId) {
      return res.status(400).json({ message: 'Bike ID is required.' });
    }

    const durationHours = parseFloat(duration) || 1;
    if (durationHours <= 0) {
      return res.status(400).json({ message: 'Booking duration must be greater than 0.' });
    }

    // 2. Fetch the bike and verify it exists
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found.' });
    }

    // 3. Check if the bike is currently available
    if (bike.status !== 'available') {
      return res.status(400).json({ 
        message: 'This bike is currently unavailable. It might be already booked or in use.' 
      });
    }

    // 4. Perform Optimistic Concurrency Control (OCC) Check-and-Set
    // Try to update the bike status to 'booked' and increment version, 
    // BUT only if its status is still 'available' and the version matches the one we read.
    const updatedBike = await Bike.findOneAndUpdate(
      { 
        _id: bikeId, 
        status: 'available', 
        version: bike.version 
      },
      { 
        status: 'booked', 
        $inc: { version: 1 } 
      },
      { returnDocument: 'after' }
    );

    // If updatedBike is null, it means the version or status changed in the database 
    // between our read (step 2) and our write (step 4). A race condition occurred!
    if (!updatedBike) {
      console.warn(`[Concurrency Conflict] Failed to book bike ${bikeId} for user ${req.user._id}. Version mismatch.`);
      return res.status(409).json({
        message: 'Booking conflict: This bike was just booked by another user. Please choose another bike.'
      });
    }

    // 5. Create and save the Booking document
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    const booking = new Booking({
      userId: req.user._id,
      bikeId: bike._id,
      startTime,
      endTime,
      status: 'active'
    });

    try {
      await booking.save();
    } catch (bookingSaveErr) {
      // Roll back bike status if booking creation fails
      console.error('[Booking] Booking save failed, rolling back bike status:', bookingSaveErr);
      await Bike.findByIdAndUpdate(bikeId, { status: 'available', $inc: { version: 1 } });
      throw bookingSaveErr;
    }

    console.log(`[Booking] Successfully booked bike ${bikeId} for user ${req.user._id}. Booking ID: ${booking._id}`);

    return res.status(201).json({
      message: 'Bike booked successfully!',
      booking: {
        _id: booking._id,
        bikeId: booking.bikeId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      },
      bike: updatedBike
    });

  } catch (error) {
    console.error('Error in createBooking:', error);
    return res.status(500).json({ message: 'Server error during booking creation.' });
  }
};

// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('bikeId')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return res.status(500).json({ message: 'Server error while retrieving bookings.' });
  }
};

// @desc    Cancel an active booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // 1. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // 2. Authorize the user (ensure it's their booking)
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
    }

    // 3. Verify the booking is still active
    if (booking.status !== 'active') {
      return res.status(400).json({ message: 'This booking is already completed or cancelled.' });
    }

    // 4. Update booking status to cancelled
    booking.status = 'cancelled';
    booking.actualEndTime = new Date(); // Optional: log when they cancelled
    await booking.save();

    // 5. Set the bike back to 'available' and increment version
    const updatedBike = await Bike.findByIdAndUpdate(
      booking.bikeId,
      { 
        status: 'available',
        $inc: { version: 1 } 
      },
      { returnDocument: 'after' }
    );

    console.log(`[Booking] Cancelled booking ${bookingId}. Bike ${booking.bikeId} status set to available.`);

    return res.status(200).json({
      message: 'Booking cancelled successfully.',
      booking,
      bike: updatedBike
    });

  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return res.status(500).json({ message: 'Server error during booking cancellation.' });
  }
};
