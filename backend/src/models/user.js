import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim:true,
    },
    password: {
        type: String,
        required:true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase:true,
    },
    createdAt:{
        type: Date,
        default:Date.now,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim:true
    },
    isVerified: {
        type: Boolean,
        default:false
    }
});

const User = mongoose.model("User", userSchema);
export default User;