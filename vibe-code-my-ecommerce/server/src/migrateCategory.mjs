// ============================================
// Migration: เพิ่ม category ให้สินค้าที่ยังไม่มี
// รันด้วย: node src/migrateCategory.mjs
// ============================================

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/products.js";

dotenv.config();

// แผนที่ชื่อสินค้า → หมวดหมู่ (เดาว่าถูกต้องที่สุดจากชื่อ)
const nameToCategory = {
  "คณิต": "คณิตศาสตร์",
  "math": "คณิตศาสตร์",
  "อังกฤษ": "ภาษาอังกฤษ",
  "english": "ภาษาอังกฤษ",
  "grammar": "ภาษาอังกฤษ",
  "เคมี": "เคมี",
  "chem": "เคมี",
  "ฟิสิกส์": "ฟิสิกส์",
  "physics": "ฟิสิกส์",
  "computer": "Computer Science",
  "cs": "Computer Science",
  "coding": "Computer Science",
  "โปรแกรม": "Computer Science",
};

async function migrateCategory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("เชื่อมต่อ MongoDB สำเร็จ");

    // หาสินค้าที่ยังไม่มี category
    const products = await Product.find({ category: { $exists: false } });
    console.log(`พบสินค้าที่ยังไม่มี category: ${products.length} รายการ`);

    for (const product of products) {
      // พยายามเดา category จากชื่อ
      let category = "ทั่วไป";
      const nameLower = product.product_name.toLowerCase();
      for (const [keyword, cat] of Object.entries(nameToCategory)) {
        if (nameLower.includes(keyword)) {
          category = cat;
          break;
        }
      }

      await Product.updateOne({ _id: product._id }, { $set: { category } });
      console.log(`✓ ${product.product_name} → ${category}`);
    }

    // กรณีมี category แล้วแต่เป็นค่าว่าง
    const emptyCategory = await Product.find({ category: "" });
    if (emptyCategory.length > 0) {
      await Product.updateMany({ category: "" }, { $set: { category: "ทั่วไป" } });
      console.log(`✓ แก้ไข category ว่าง ${emptyCategory.length} รายการ → ทั่วไป`);
    }

    console.log("\nเสร็จสิ้น!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err.message);
    process.exit(1);
  }
}

migrateCategory();
