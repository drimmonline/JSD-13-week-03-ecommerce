import express from "express";
import { protectRoute, adminOnly } from "../middlewares/authMiddleware.js";
import {
  getAllExams,
  getExamById,
  getExamByIdForAdmin,
  getExamWithAnswerKey,
  submitExam,
  getMyExamHistory,
  getMyLatestResult,
  createExam,
  updateExam,
  deleteExam,
} from "../controllers/examController.js";

const examRouter = express.Router();

// ดูรายการข้อสอบทั้งหมด (ไม่ต้องล็อกอิน)
examRouter.get("/", getAllExams);

// ⚠️ Route ที่มี path ตายตัว ต้องมาก่อน /:id เพื่อไม่ให้ Express จับคู่ผิด
// ดูประวัติการทำข้อสอบของผู้ใช้ (ต้องล็อกอิน)
examRouter.get("/history/my", protectRoute, getMyExamHistory);

// ส่งคำตอบ (ต้องล็อกอิน)
examRouter.post("/submit", protectRoute, submitExam);

// 🛡️ สร้างข้อสอบใหม่ (Admin เท่านั้น)
examRouter.post("/", protectRoute, adminOnly, createExam);

// 🛡️ ดูข้อสอบแบบครบทุก field สำหรับ Admin แก้ไข (ต้องล็อกอิน + เป็น admin)
examRouter.get("/admin/:id", protectRoute, adminOnly, getExamByIdForAdmin);

// ดูรายละเอียดข้อสอบ (ไม่ต้องล็อกอิน)
examRouter.get("/:id", getExamById);

// ดูข้อสอบพร้อมเฉลย (ต้องล็อกอิน)
examRouter.get("/:id/answers", protectRoute, getExamWithAnswerKey);

// ดูผลลัพธ์ล่าสุดของข้อสอบชุดเฉพาะ (ต้องล็อกอิน)
examRouter.get("/:exam_id/latest-result", protectRoute, getMyLatestResult);

// 🛡️ ลบข้อสอบ (Admin เท่านั้น)
examRouter.delete("/:id", protectRoute, adminOnly, deleteExam);

// 🛡️ แก้ไขข้อสอบ (Admin เท่านั้น)
examRouter.put("/:id", protectRoute, adminOnly, updateExam);

export default examRouter;
