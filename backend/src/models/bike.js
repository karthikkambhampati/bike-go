import mongoose from "mongoose"; // Cleaned up import

const bikeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Road', 'Electric'] // (Note: You can add 'Mountain' or 'Hybrid' here too if you want!)
    },
     name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
        trim: true // This will store the image URL
    },
    hourlyRate: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'booked', 'in_use'],
        default: 'available' // Added default value
    },
    version: {
        type: Number,
        required: true,
        default: 0
    },
});

const Bike = mongoose.model('Bike', bikeSchema);

export default Bike;
