import Payment from "../models/payment.js";
import Order from "../models/orders.js";
import { v4 as uuidv4 } from "uuid";

// สร้าง QR Code สำหรับชำระเงิน
export const createQrPayment = async (request, response) => {
  try {
    const userId = request.user.userId;
    const { order_id } = request.body;

    // ค้นหาออเดอร์
    const order = await Order.findOne({ _id: order_id, user_id: userId });
    if (!order) {
      return response.status(404).json({ msg: "ไม่พบออเดอร์นี้" });
    }

    if (order.order_status === "paid") {
      return response.status(400).json({ msg: "ออเดอร์นี้ชำระเงินแล้ว" });
    }

    // แปลง total_amount จาก Decimal128 เป็น Number
    const amount = parseFloat(order.total_amount.toString());

    // สร้าง transaction_id จำลอง (ในการใช้งานจริงจะได้จาก Payment Gateway)
    const transactionId = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;

    // สร้าง QR Code URL จำลอง (ในการใช้จริงจะเรียก API ของ Payment Gateway)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=THB|${amount}|${transactionId}|${order_id}`;

    // บันทึกข้อมูลการชำระเงิน
    const newPayment = new Payment({
      _id: uuidv4(),
      user_id: userId,
      order_id: order_id,
      amount: amount,
      currency: "THB",
      payment_method: "qr_code",
      transaction_id: transactionId,
      qr_code_url: qrCodeUrl,
      status: "pending",
    });

    const savedPayment = await newPayment.save();

    return response.status(201).json({
      msg: "สร้าง QR Code สำเร็จ",
      payment: {
        _id: savedPayment._id,
        transaction_id: transactionId,
        qr_code_url: qrCodeUrl,
        amount: amount,
        currency: "THB",
        status: "pending",
      },
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `สร้าง QR Code ไม่สำเร็จ: ${err.message}` });
  }
};

// ตรวจสอบสถานะการชำระเงิน
export const getPaymentStatus = async (request, response) => {
  try {
    const { id } = request.params;

    const payment = await Payment.findOne({ _id: id });
    if (!payment) {
      return response.status(404).json({ msg: "ไม่พบรายการชำระเงินนี้" });
    }

    return response.json({
      _id: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      transaction_id: payment.transaction_id,
    });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// Webhook รับการแจ้งเตือนจาก Payment Gateway
export const handlePaymentWebhook = async (request, response) => {
  try {
    const { transaction_id, status } = request.body;

    // ค้นหาการชำระเงินจาก transaction_id
    const payment = await Payment.findOne({ transaction_id });
    if (!payment) {
      return response.status(404).json({ msg: "ไม่พบรายการชำระเงิน" });
    }

    // อัปเดตสถานะการชำระเงิน
    if (status === "successful") {
      payment.status = "successful";
      await payment.save();

      // อัปเดตสถานะออเดอร์เป็น "paid"
      await Order.findOneAndUpdate(
        { _id: payment.order_id },
        { $set: { order_status: "paid" } },
      );

      return response.json({ msg: "ชำระเงินสำเร็จ" });
    } else if (status === "failed") {
      payment.status = "failed";
      await payment.save();
      return response.json({ msg: "การชำระเงินล้มเหลว" });
    }

    return response.json({ msg: "สถานะไม่เปลี่ยนแปลง" });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// จำลองการชำระเงินสำเร็จ (สำหรับทดสอบ)
export const simulatePaymentSuccess = async (request, response) => {
  try {
    const { id } = request.params;

    const payment = await Payment.findOne({ _id: id });
    if (!payment) {
      return response.status(404).json({ msg: "ไม่พบรายการชำระเงิน" });
    }

    payment.status = "successful";
    await payment.save();

    // อัปเดตสถานะออเดอร์
    await Order.findOneAndUpdate(
      { _id: payment.order_id },
      { $set: { order_status: "paid" } },
    );

    return response.json({ msg: "จำลองชำระเงินสำเร็จ" });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// ดูประวัติการชำระเงินของผู้ใช้
export const getMyPayments = async (request, response) => {
  try {
    const userId = request.user.userId;
    const payments = await Payment.find({ user_id: userId }).sort({ createdAt: -1 });
    return response.json(payments);
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};
