// ============================================
// Seed Admin User - สร้างผู้ใช้ Admin สำหรับทดสอบ
// รันด้วย: node src/seedAdmin.mjs
// ============================================

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY_YOUR_MOS_2026";

// โครงสร้าง User Schema (คัดลอกจาก models/users.js เพื่อใช้ใน script นี้)
const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    account_type: { type: String, default: "student" },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    login_status: { type: Boolean, default: false },
    profile: {
      name: String,
      lastname: String,
      address: String,
      email: String,
      phone_number: String,
      image: String,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("เชื่อมต่อ MongoDB สำเร็จ");

    const adminUsername = "admin";
    const adminPassword = "admin123";

    // ตรวจสอบว่ามี admin แล้วหรือยัง
    const existing = await User.findOne({ username: adminUsername });
    if (existing) {
      // อัปเดตเป็น admin ถ้ายังไม่ใช่
      if (existing.account_type !== "admin") {
        existing.account_type = "admin";
        await existing.save();
        console.log(`อัปเดต "${adminUsername}" เป็น admin สำเร็จ`);
      } else {
        console.log(`"${adminUsername}" เป็น admin อยู่แล้ว`);
      }
    } else {
      // สร้างใหม่
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        _id: uuidv4(),
        account_type: "admin",
        username: adminUsername,
        password: hashedPassword,
        profile: {
          name: "Admin",
          lastname: "System",
          email: "admin@studysheet.com",
        },
      });
      await adminUser.save();
      console.log(`สร้าง Admin สำเร็จ: username="${adminUsername}" password="${adminPassword}"`);
    }

    await mongoose.disconnect();
    console.log("เสร็จสิ้น");
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err.message);
    process.exit(1);
  }
}

seedAdmin();
