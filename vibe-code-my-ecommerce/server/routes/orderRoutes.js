import express from "express";
import {
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protectRoute } from "../middlewares/authMiddleware.js";

const orderRouter = express.Router();

orderRouter.post("/checkout", protectRoute, createOrderFromCart);  // สร้างออเดอร์
orderRouter.get("/", protectRoute, getMyOrders);                   // ดูประวัติออเดอร์
orderRouter.get("/:id", protectRoute, getOrderById);               // ดูรายละเอียดออเดอร์
orderRouter.patch("/:id/status", protectRoute, updateOrderStatus); // อัปเดตสถานะ

export default orderRouter;
