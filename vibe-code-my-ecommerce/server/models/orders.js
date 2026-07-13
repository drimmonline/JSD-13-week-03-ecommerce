import mongoose from "mongoose";

// โครงสร้างของสินค้าแต่ละรายการในออเดอร์ (Subdocument)
const orderDetailSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
      ref: "Product", // ผูกไอดีอ้างอิงไปยังโมเดล Product
    },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price_at_purchase: {
      type: mongoose.Schema.Types.Decimal128, // รองรับตัวเลขทศนิยมการเงินแม่นยำสูง
      required: true,
    },
  },
  { _id: false },
);

// โครงสร้างหลักของบิลใบสั่งซื้อ
const orderSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // ใช้ UUIDv4
    user_id: { type: String, required: true, ref: "User" },
    order_date: { type: Date, default: Date.now },
    total_amount: {
      type: mongoose.Schema.Types.Decimal128, // ยอดราคารวมทั้งบิล
      required: true,
    },
    order_status: {
      type: String,
      required: true,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shipping_address: { type: String, required: true },
    order_details: [orderDetailSchema], // เก็บรายการสินค้าเป็น Array
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
