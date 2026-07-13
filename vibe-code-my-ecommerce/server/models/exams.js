import mongoose from "mongoose";

// โครงสร้างของตัวเลือกคำตอบแต่ละข้อ
const optionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    text: { type: String },
    option_text: { type: String },
  },
  { _id: false },
);

// โครงสร้างของแต่ละข้อสอบ
const questionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    question_text: { type: String, required: true },
    options: [optionSchema],
    correct_option_id: { type: String, required: true }, // รองรับทั้ง UUID และ "A","B","C","D"
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

// โครงสร้างหลักของชุดข้อสอบ
const examSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    exam_name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "ทั่วไป", trim: true },
    time_limit_minutes: { type: Number, required: true, min: 1 },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  },
);

// 🛠️ ฟังก์ชันเสริมล้างข้อมูลและแก้คำผิดอัตโนมัติก่อนบันทึกหรือใช้งาน
examSchema.pre("validate", function () {
  if (this.questions && this.questions.length > 0) {
    this.questions.forEach((q) => {
      // 1. ดักแก้ปัญหากรณีข้อมูล text กับ option_text สลับกัน
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          if (opt.option_text && !opt.text) opt.text = opt.option_text;
          if (opt.text && !opt.option_text) opt.option_text = opt.text;
        });
      }
    });
  }
});

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
