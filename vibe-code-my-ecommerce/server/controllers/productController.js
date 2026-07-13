import { request } from "express";
import Product from "../models/products.js"; // 🎯 ใส่ .js ปิดท้ายเส้นทาง
import Order from "../models/orders.js";
import { v4 as uuidv4 } from "uuid"; // (เก็บไว้รอใช้ในฟังก์ชัน createProduct ได้เลย)

// 💡 บรรทัดแรกสุดของ express ลบทิ้งไปเรียบร้อยแล้วครับ

// 🛠️ ดึงสินค้าขายดี (นับจำนวนขายจาก orders)
export const getBestSellingProducts = async (request, response) => {
  try {
    // ดึงออเดอร์ที่ชำระแล้ว (paid / shipped / delivered)
    const orders = await Order.find({
      order_status: { $in: ["paid", "shipped", "delivered"] },
    });

    // นับจำนวนขายแต่ละ product_id
    const salesMap = {};
    orders.forEach((order) => {
      (order.order_details || []).forEach((item) => {
        const pid = item.product_id;
        if (!salesMap[pid]) salesMap[pid] = 0;
        salesMap[pid] += item.quantity;
      });
    });

    // เรียงลำดับจากขายมากไปน้อย
    const sortedIds = Object.entries(salesMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // ดึงข้อมูลสินค้าจริงจาก DB
    const products = await Product.find({ _id: { $in: sortedIds.length > 0 ? sortedIds : ["__none__"] } });

    // เรียงตามลำดับขายดี
    const productMap = {};
    products.forEach((p) => { productMap[p._id] = p; });
    const sorted = sortedIds.map((id) => productMap[id]).filter(Boolean);

    return response.json(sorted);
  } catch (err) {
    return response.status(500).json({ msg: `ดึงสินค้าขายดีไม่สำเร็จ: ${err.message}` });
  }
};

export const getAllProduct = async (request, response) => {
  try {
    const allProduct = await Product.find();
    return response.json(allProduct);
  } catch (err) {
    return response.status(500).json({
      msg: `ดึงข้อมูลไม่สำเร็จ: ${err.message}`,
    });
  }
};

export const getProductbyID = async (request, response) => {
  try {
    const { id } = request.params;
    const productdata = await Product.findOne({ _id: id });
    if (!productdata) {
      return response
        .status(404)
        .json({ msg: `ไม่พบสินค้าจาก ID ${productdata}` });
    }
    return response.json(productdata);
  } catch (err) {
    return response.status(500).json({ msg: `ไม่สำเร็จ ${err.message}` });
  }
};

export const createProduct = async (request, response) => {
  try {
    const { body } = request;

    const newProduct = new Product({
      ...body, // 1. ดึงข้อมูลสินค้าที่ส่งมาจาก Postman (ชื่อ, รายละเอียด, ราคา, สต็อก)
      _id: uuidv4(), // 2. สลักไอดี UUID ทับไว้ล่างสุดเสมอ เพื่อป้องกันไม่ให้หน้าบ้านส่งไอดีมามั่ว
    });

    const savedProduct = await newProduct.save();

    return response.status(201).json({
      msg: "บันทึกข้อมูลสินค้าสำเร็จ 🎉",
      data: savedProduct,
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `สร้างสินค้าไม่สำเร็จ: ${err.message}` });
  }
};

export const updateProductPut = async (request, response) => {
  try {
    const productId = request.params.id;
    const newData = request.body;

    // 🛠️ ใช้ $set แทน findOneAndReplace เพื่อรักษา _id และ timestamps ไว้
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: newData },
      { returnDocument: "after" },
    );

    if (!updatedProduct) {
      return response
        .status(404)
        .json({ msg: `ไม่พบสินค้าไอดี: ${productId}` });
    }
    return response.json({ msg: "อัปเดตข้อมูลสำเร็จ", data: updatedProduct });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `อัปเดตข้อมูลไม่สำเร็จ: ${err.message}` });
  }
};

// อัปเดตข้อมูลสินค้าเฉพาะจุด (PATCH)
export const updateProductPatch = async (request, response) => {
  try {
    const productId = request.params.id; // ดึงไอดีสินค้าจาก URL
    const updateData = request.body; // ดึงฟิลด์ที่หน้าบ้านต้องการจะแก้ไข

    // ค้นหาด้วยคีย์ _id และทำการอัปเดตข้อมูลเฉพาะคีย์ที่ส่งมาผ่าน $set
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: updateData },
      { returnDocument: "after" }, // 🎯 ใช้คำสั่งเวอร์ชันใหม่ปี 2026 แทน { new: true } ตามที่ระบบแจ้งเตือน
    );

    // ถ้าหาไอดีสินค้าชิ้นนั้นไม่เจอ
    if (!updatedProduct) {
      return response
        .status(404)
        .json({ msg: `ไม่พบสินค้าไอดี: ${productId}` });
    }

    // ส่งข้อมูลที่อัปเดตสำเร็จแล้วกลับไป
    return response.json({
      msg: "อัปเดตข้อมูลสินค้าสำเร็จ",
      data: updatedProduct,
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `อัปเดตสินค้าไม่สำเร็จ: ${err.message}` });
  }
};

export const deleteProduct = async (request, response) => {
  try {
    const productId = request.params.id;

    // ค้นหาด้วย _id (String UUID) แล้วลบทิ้งทันที
    const deletedProduct = await Product.findOneAndDelete({ _id: productId });

    if (!deletedProduct) {
      return response
        .status(404)
        .json({ msg: `ไม่พบสินค้าไอดีที่ต้องการลบ: ${productId}` });
    }

    return response.json({
      msg: "ลบข้อมูลผู้ใช้เรียบร้อยแล้ว",
      data: deletedProduct,
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ลบข้อมูลสินค้าไม่สำเร็จ: ${err.message}` });
  }
};
