import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`Admin user "${username}" already exists`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    console.log(`Admin user "${username}" created successfully`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
