import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
      ref: "Product", // ผูกไอดีอ้างอิงไปยัง Model Product
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // UUIDv4
    user_id: {
      type: String,
      required: true,
      unique: true, // 🎯 ล็อกไว้เลยว่าผู้ใช้ 1 คน มีตะกร้าได้ใบเดียวเท่านั้น
      ref: "User",
    },
    items: [cartItemSchema], // บรรจุอาเรย์รายการสินค้าที่เลือกไว้
  },
  { timestamps: true },
);
const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
