import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Product from "../models/products.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 📌 ข้อมูลสินค้าชีทสรุป 5 รายการ
const products = [
  {
    product_name: "ชีทสรุปคณิตศาสตร์ ม.ปลาย (บทนิพจน์ & สมการ)",
    product_detail:
      "สรุปเนื้อหาคณิตศาสตร์ชั้นมัธยมศึกษาตอนปลาย ครอบคลุม ฟังก์ชัน สมการ ค่าสัมบูรณ์ และระบบสมการ มีตัวอย่างโจทย์พร้อมเฉลย 30 ข้อ",
    product_image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
    stock_quantity: 50,
    product_price: 149,
  },
  {
    product_name: "ชีทสรุปภาษาอังกฤษ Grammar & Writing",
    product_detail:
      "สรุปหลักไวยากรณ์ภาษาอังกฤษ Tenses, Conditionals, Reported Speech พร้อมตัวอย่างการเขียน Essay ทั้ง Task 1 และ Task 2",
    product_image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
    stock_quantity: 35,
    product_price: 179,
  },
  {
    product_name: "ชีทสรุปเคมี ม.ปลาย (สมดุลเคมี & กรด-ด่าง)",
    product_detail:
      "รวมเนื้อหาเคมี的重要 concepts: สมดุลเคมี ค่า pH กรด-ด่าง ปฏิกิริยาร氧还 พร้อมตาราง Periodic และสูตรคำนวณที่ต้องรู้ก่อนสอบ",
    product_image:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
    stock_quantity: 40,
    product_price: 159,
  },
  {
    product_name: "ชีทสรุปฟิสิกส์ ม.ปลาย (กลศาสตร์ & พลังงาน)",
    product_detail:
      "สรุปเนื้อหาฟิสิกส์ชั้นมัธยมตอนปลาย แรง การเคลื่อนที่ กฎของนิวตัน พลังงาน โมเมนตัม พร้อมแผนภาพ Lami's Theorem และกราฟ",
    product_image:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop",
    stock_quantity: 30,
    product_price: 169,
  },
  {
    product_name: "ชีทสรุป Computer Science พื้นฐาน (Data Structure & Algorithm)",
    product_detail:
      "สรุปเนื้อหา CS สำหรับนักศึกษา ครอบคลุม Array, Linked List, Stack, Queue, Tree, Graph พร้อม Complexity Analysis (Big-O) และตัวอย่างโค้ด Python",
    product_image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    stock_quantity: 25,
    product_price: 199,
  },
];

async function seedProducts() {
  try {
    console.log("เชื่อมต่อ MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("เชื่อมต่อสำเร็จ!\n");

    // ลบสินค้าเก่าทั้งหมดก่อน (cleanslate)
    const deleted = await Product.deleteMany({});
    console.log(`ลบสินค้าเก่า ${deleted.deletedCount} รายการ`);

    // สร้างสินค้าใหม่ทีละรายการ
    const { v4: uuidv4 } = await import("uuid");

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      const product = new Product({
        _id: uuidv4(),
        ...item,
      });
      const saved = await product.save();
      console.log(`[${i + 1}/${products.length}] ✓ ${saved.product_name} — ฿${saved.product_price}`);
    }

    console.log("\nสร้างสินค้าเสร็จสิ้น!");
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("ปิดการเชื่อมต่อ MongoDB");
  }
}

seedProducts();
