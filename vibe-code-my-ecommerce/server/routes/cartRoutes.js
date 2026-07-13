import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  addToCart,
  removeFromCart,
  getMyCart,
  updateQuantity,
  clearCart,
} from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.get("/", protectRoute, getMyCart);           // ดูตะกร้าสินค้า
cartRouter.post("/", protectRoute, addToCart);           // เพิ่มสินค้าลงตะกร้า
cartRouter.put("/", protectRoute, updateQuantity);       // อัปเดตจำนวนสินค้า
cartRouter.delete("/", protectRoute, removeFromCart);    // ลบสินค้าออก
cartRouter.delete("/clear", protectRoute, clearCart);    // ล้างตะกร้าทั้งหมด

export default cartRouter;
