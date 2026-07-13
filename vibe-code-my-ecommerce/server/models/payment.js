import mongoose from "mongoose";

// โครงสร้างตารางเก็บข้อมูลการชำระเงิน
const paymentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User" },
    order_id: { type: String, required: true, ref: "Order" },
    amount: { type: Number, required: true }, // จำนวนเงินที่ชำระ
    currency: { type: String, default: "THB" }, // สกุลเงิน
    payment_method: { type: String, default: "qr_code" }, // วิธีชำระเงิน
    transaction_id: { type: String, unique: true, sparse: true }, // ไอดีธุรกรรมจาก Payment Gateway
    qr_code_url: { type: String, default: "" }, // URL ของ QR Code
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
