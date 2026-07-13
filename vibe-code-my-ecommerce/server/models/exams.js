import mongoose from "mongoose";

// โครงสร้างของตัวเลือกคำตอบแต่ละข้อ
const optionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

// โครงสร้างของแต่ละข้อสอบ
const questionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    question_text: { type: String, required: true },
    options: [optionSchema], // ตัวเลือกคำตอบ A-D
    correct_option_id: { type: String, required: true }, // ข้อที่ถูกต้อง (เก็บไว้เฉลย)
    explanation: { type: String, default: "" }, // คำอธิบายเฉลย (ถ้ามี)
  },
  { _id: false },
);

// โครงสร้างหลักของชุดข้อสอบ
const examSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    exam_name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "ทั่วไป", trim: true }, // หมวดหมู่ (ถ้าไม่ส่งมาจะเป็น "ทั่วไป")
    time_limit_minutes: { type: Number, required: true, min: 1 }, // เวลาทำข้อสอบ (นาที)
    questions: [questionSchema], // รายการข้อสอบทั้งหมด
  },
  { timestamps: true },
);

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
