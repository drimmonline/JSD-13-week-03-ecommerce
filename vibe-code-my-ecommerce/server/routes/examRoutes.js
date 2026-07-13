import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  getAllExams,
  getExamById,
  getExamWithAnswerKey,
  submitExam,
  getMyExamHistory,
  getMyLatestResult,
  createExam,
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

// สร้างข้อสอบใหม่ (เปิด public สำหรับ development)
examRouter.post("/", createExam);

// ดูรายละเอียดข้อสอบ (ไม่ต้องล็อกอิน)
examRouter.get("/:id", getExamById);

// ดูข้อสอบพร้อมเฉลย (ต้องล็อกอิน)
examRouter.get("/:id/answers", protectRoute, getExamWithAnswerKey);

// ดูผลลัพธ์ล่าสุดของข้อสอบชุดเฉพาะ (ต้องล็อกอิน)
examRouter.get("/:exam_id/latest-result", protectRoute, getMyLatestResult);

// ลบข้อสอบ (ต้องล็อกอิน - admin only ในอนาคต)
examRouter.delete("/:id", protectRoute, deleteExam);

export default examRouter;
