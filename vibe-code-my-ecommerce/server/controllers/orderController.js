import Order from "../models/orders.js";
import Cart from "../models/carts.js";
import Product from "../models/products.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// สร้างออเดอร์จากตะกร้า
export const createOrderFromCart = async (request, response) => {
  try {
    const userId = request.user.userId;
    const { shipping_address } = request.body;

    // ค้นหาตะกร้าสินค้า
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
      return response
        .status(400)
        .json({ msg: "ไม่สามารถสร้างออเดอร์ได้ เนื่องจากไม่มีสินค้าในตะกร้า" });
    }

    let calculatedTotal = 0;
    const finalOrderDetails = [];

    // ลูปรายการสินค้าในตะกร้า เพื่อดึงราคาและหักสต็อก
    for (const item of cart.items) {
      const product = await Product.findOne({ _id: item.product_id });

      if (!product) {
        return response
          .status(404)
          .json({ msg: `ไม่พบสินค้าไอดี ${item.product_id} ในระบบ` });
      }
      if (product.stock_quantity < item.quantity) {
        return response
          .status(400)
          .json({ msg: `สินค้า ${product.product_name} ในสต็อกไม่เพียงพอ` });
      }

      const productPrice = parseFloat(product.product_price.toString());
      const itemTotalPrice = productPrice * item.quantity;
      calculatedTotal += itemTotalPrice;

      finalOrderDetails.push({
        product_id: product._id,
        product_name: product.product_name,
        quantity: item.quantity,
        price_at_purchase: mongoose.Types.Decimal128.fromString(
          productPrice.toFixed(2),
        ),
      });

      // หักจำนวนสินค้าออกจากสต็อก
      product.stock_quantity -= item.quantity;
      await product.save();
    }

    // สร้างออเดอร์ใหม่
    const newOrder = new Order({
      _id: uuidv4(),
      user_id: userId,
      total_amount: mongoose.Types.Decimal128.fromString(
        calculatedTotal.toFixed(2),
      ),
      shipping_address: shipping_address,
      order_details: finalOrderDetails,
    });

    const savedOrder = await newOrder.save();

    // ล้างตะกร้า
    cart.items = [];
    await cart.save();

    return response.status(201).json({
      msg: "สร้างใบสั่งซื้อสำเร็จ",
      order: savedOrder,
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `เกิดข้อผิดพลาดในการสร้างออเดอร์: ${err.message}` });
  }
};

// ดูประวัติออเดอร์ของผู้ใช้
export const getMyOrders = async (request, response) => {
  try {
    const userId = request.user.userId;
    const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 });

    return response.json(orders);
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ดึงประวัติออเดอร์ไม่สำเร็จ: ${err.message}` });
  }
};

// 🛡️ ดูออเดอร์ทั้งหมด (Admin เท่านั้น)
export const getAllOrders = async (request, response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return response.json(orders);
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ดึงข้อมูลออเดอร์ทั้งหมดไม่สำเร็จ: ${err.message}` });
  }
};

// ดูรายละเอียดออเดอร์ตาม ID
export const getOrderById = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user.userId;

    const order = await Order.findOne({ _id: id, user_id: userId });

    if (!order) {
      return response.status(404).json({ msg: "ไม่พบออเดอร์นี้" });
    }

    return response.json(order);
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ดึงข้อมูลออเดอร์ไม่สำเร็จ: ${err.message}` });
  }
};

// อัปเดตสถานะออเดอร์ (สำหรับ admin)
export const updateOrderStatus = async (request, response) => {
  try {
    const { id } = request.params;
    const { order_status } = request.body;

    const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(order_status)) {
      return response.status(400).json({ msg: "สถานะออเดอร์ไม่ถูกต้อง" });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id },
      { $set: { order_status } },
      { returnDocument: "after" },
    );

    if (!updatedOrder) {
      return response.status(404).json({ msg: "ไม่พบออเดอร์นี้" });
    }

    return response.json({ msg: "อัปเดตสถานะสำเร็จ", data: updatedOrder });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `อัปเดตสถานะไม่สำเร็จ: ${err.message}` });
  }
};
