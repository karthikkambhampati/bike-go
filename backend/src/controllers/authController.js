import bcrypt from "bcryptjs";
import User from "../models/user.js"; // Capitalized 'User'
import Otp from "../models/otp.js";   // Capitalized 'Otp'
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const { username, password, email, phone } = req.body;

        if (!username || !password || !email || !phone) {
            return res.status(400).json({
                message: "please enter all input fields"
            });
        }
        
        // Using capitalized 'User'
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: "A user with this email or phone number already exists." 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
   
        // Using capitalized 'User'
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            phone,
            isVerified: false
        });

        await newUser.save();

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Using capitalized 'Otp'
        await Otp.create({
            email,
            hashedOtp,
            expiresAt
        });

        console.log(`[Email Mock] OTP code for ${email} is: ${otpCode}`);

        return res.status(201).json({
            message: "Registration successful! Please check your email for the verification OTP."
        });
    
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error during registration." });
    }
}

export const verifyOtp = async (req, res) => {
    try {
        // Here, 'otp' is the 6-digit string from the request body
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "please enter valid otp or email"
            });
        }

        // Using capitalized 'Otp' (model). No more shadowing collision!
        const otpRecord = await Otp.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({
                message: "OTP expired or email not found. Please request a new one."
            });
        }
        
        if (otpRecord.attempts >= 3) {
            await Otp.deleteOne({ email });
            return res.status(400).json({
                message: "too many attempts. please click resend otp to get a new code "
            });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.hashedOtp);

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({
                message: `invalid otp entered. only ${3 - otpRecord.attempts} attempts remaining.`
            });
        } else {
            // Using capitalized 'User'
            const userRecord = await User.findOne({ email });
            if (!userRecord) {
                return res.status(404).json({ message: "User not found." });
            }

            userRecord.isVerified = true;
            await userRecord.save();
            await Otp.deleteOne({ email });

            const token = jwt.sign(
                { userId: userRecord._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                token,
                username: userRecord.username,
                email
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error during OTP verification." });
    }
}

export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Please enter your email."
            });
        }

        // Using capitalized 'User'
        const userRecord = await User.findOne({ email });
        if (!userRecord) {
            return res.status(404).json({
                message: "User not found with this email."
            });
        }
        
        if (userRecord.isVerified) {
            return res.status(400).json({
                message: "This account is already verified. Please log in."
            });
        }

        // Using capitalized 'Otp'
        await Otp.deleteOne({ email });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Using capitalized 'Otp'
        await Otp.create({
            email,
            hashedOtp,
            expiresAt
        });

        console.log(`[Email Mock] Resent OTP code for ${email} is: ${otpCode}`);

        return res.status(200).json({
            message: "A new OTP code has been sent to your email."
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server error during resending OTP."
        });
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                message: "Please enter your username and password."
            });
        }

        // Using capitalized 'User'
        const userRecord = await User.findOne({ username });
        if (!userRecord) {
            return res.status(400).json({
                message: "invalid username or password." // Generic security message
            });
        }

        if (userRecord.isVerified == false) {
            return res.status(400).json({
                message: "Please verify your email first before logging in."
            });
        }

        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "invalid username or password."
            });
        } else {
            const token = jwt.sign(
               { userId: userRecord._id }, 
               process.env.JWT_SECRET, 
               { expiresIn: '7d' }
            );

            return res.status(200).json({
                token,
                username,
                email: userRecord.email
            });
        }
    
    } catch (err) {
        console.error("something went wrong in the login function/authController" + err);
        return res.status(500).json({
            message: "error while logging in "
        });
    }
}