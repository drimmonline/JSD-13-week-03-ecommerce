import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  createQrPayment,
  getPaymentStatus,
  handlePaymentWebhook,
  simulatePaymentSuccess,
  getMyPayments,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// สร้าง QR Code สำหรับชำระเงิน (ต้องล็อกอิน)
paymentRouter.post("/charge", protectRoute, createQrPayment);

// ตรวจสอบสถานะการชำระเงิน (ต้องล็อกอิน)
paymentRouter.get("/status/:id", protectRoute, getPaymentStatus);

// Webhook รับแจ้งเตือนจาก Payment Gateway (ไม่ต้องล็อกอิน - Gateway เรียกมา)
paymentRouter.post("/webhook", handlePaymentWebhook);

// จำลองการชำระเงินสำเร็จ (สำหรับทดสอบ)
paymentRouter.post("/simulate/:id", simulatePaymentSuccess);

// ดูประวัติการชำระเงิน (ต้องล็อกอิน)
paymentRouter.get("/history", protectRoute, getMyPayments);

export default paymentRouter;
