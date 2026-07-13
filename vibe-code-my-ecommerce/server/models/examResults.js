import mongoose from "mongoose";

// โครงสร้างเก็บผลลัพธ์การทำข้อสอบแต่ละครั้ง
const examResultSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User" },
    exam_id: { type: String, required: true, ref: "Exam" },
    score: { type: Number, required: true, min: 0 }, // คะแนนที่ได้
    total_questions: { type: Number, required: true }, // จำนวนข้อทั้งหมด
    correct_count: { type: Number, required: true, default: 0 }, // จำนวนข้อที่ตอบถูก
    time_spent_seconds: { type: Number, required: true, default: 0 }, // เวลาที่ใช้ไป (วินาที)
    answers: {
      type: Map,
      of: String, // เก็บคำตอบของผู้ใช้ เช่น { "q1": "opt_a", "q2": "opt_c" }
      default: {},
    },
    completed_at: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const ExamResult = mongoose.model("ExamResult", examResultSchema);
export default ExamResult;
