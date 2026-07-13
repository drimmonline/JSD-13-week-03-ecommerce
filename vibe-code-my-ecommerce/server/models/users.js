import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    account_type: { type: String, default: "customer" },
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
); // ตัวนี้จะแถมคีย์ createdAt กับ updatedAt ให้ใน DB อัตโนมัติด้วยครับ

// สร้าง Model ชื่อนามธรรมว่า "User" (Mongoose จะไปสร้างคอลเลกชันชื่อ "users" ให้ในฐานข้อมูลเอง)
const User = mongoose.model("users", userSchema);

export default User;
