import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("[Auth] CRITICAL: JWT_SECRET environment variable is missing!");
        return res.status(500).json({ message: "Server authentication configuration error" });
      }

      // Verify token
      const decoded = jwt.verify(token, secret);

      // Fetch user from DB and attach to req.user (excluding password)
      const foundUser = await User.findById(decoded.userId).select("-password");

      if (!foundUser) {
        return res.status(401).json({ message: "Not authorized, account no longer exists" });
      }

      req.user = foundUser;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired, please log in again" });
      }
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token provided" });
};
