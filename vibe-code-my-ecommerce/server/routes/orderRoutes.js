import express from "express";
import {
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} from "../controllers/orderController.js";
import { protectRoute, adminOnly } from "../middlewares/authMiddleware.js";

const orderRouter = express.Router();

orderRouter.post("/checkout", protectRoute, createOrderFromCart);  // สร้างออเดอร์
orderRouter.get("/all", protectRoute, adminOnly, getAllOrders);     // 🛡️ ดูออเดอร์ทั้งหมด (Admin)
orderRouter.get("/", protectRoute, getMyOrders);                   // ดูประวัติออเดอร์
orderRouter.get("/:id", protectRoute, getOrderById);               // ดูรายละเอียดออเดอร์
orderRouter.patch("/:id/status", protectRoute, updateOrderStatus); // อัปเดตสถานะ

export default orderRouter;
