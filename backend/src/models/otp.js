import mongoose from "mongoose"

const optSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim:true
    },
    hashedOtp: {
        type: String,
        required:true,
    },
    expiresAt: {
        type: Date,
        required:true,
    },
    attempts: {
        type: Number,
        default:0
    },
});

optSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Otp = mongoose.model('Otp', optSchema);

export default Otp;
