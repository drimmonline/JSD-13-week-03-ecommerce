import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// กำหนด __dirname สำหรับ ES Modules ก่อนเป็นอันดับแรก
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🛠️ แก้ไขตรงนี้: สั่งให้ dotenv วิ่งออกไปหาไฟล์ .env ที่อยู่โฟลเดอร์ด้านนอกสุด (Root) เสมอ
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import userRouter from "../routes/userRoutes.js";
import productRouter from "../routes/productRoutes.js";
import cartRouter from "../routes/cartRoutes.js";
import orderRouter from "../routes/orderRoutes.js";
import examRouter from "../routes/examRoutes.js";
import paymentRouter from "../routes/paymentRoutes.js";

import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

// 2. เช็คค่า URL จาก env
console.log("เช็คค่า URL จาก env:", process.env.MONGODB_URI);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// ตั้งค่า CORS ให้อนุญาตเฉพาะ front-end domain ที่กำหนด
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);

// เพิ่ม Security Headers ด้วย Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // เพิ่มโดเมน https://storage.googleapis.com เข้าไปใน imgSrc
        imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);

// Rate Limiting: จำกัดจำนวนคำขอต่อ IP (ป้องกัน DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  limit: 300, // ไม่เกิน 100 ครั้งต่อ 15 นาที
  message: { msg: "คุณยิงคำขอมากเกินไป กรุณาลองใหม่ในอีก 15 นาที" },
});

// เชื่อมต่อ MongoDB Atlas
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected successfully to MongoDB Atlas!"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// ใช้ Rate Limiter กับทุก API route
app.use("/api", limiter);

// Mount Routes ทั้งหมด
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/exams", examRouter);
app.use("/api/payment", paymentRouter);

// Root endpoint
app.get("/api", (req, res) => {
  res.json({ msg: "API Server is running" });
});

// Serve static files จากโฟลเดอร์ app/web
const appDir = path.join(__dirname, "../../app");
app.use(express.static(path.join(appDir, "web")));
app.use("/css", express.static(path.join(appDir, "css")));
app.use("/javascript", express.static(path.join(appDir, "javascript")));
app.use("/Components", express.static(path.join(appDir, "Components")));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ msg: `เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: ${err.message}` });
});

// เริ่มทำงาน Server
app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
