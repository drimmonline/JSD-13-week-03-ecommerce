import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // สำหรับใส่ UUID หน้าบ้านหรือหลังบ้านเจนให้
    product_name: { type: String, required: true, trim: true }, // trim ช่วยตัดช่องว่างหน้า-หลังให้อัตโนมัติ
    product_detail: { type: String, default: "สินค้ามาใหม่" }, // 🎯 แก้ไขเพิ่ม type:
    product_image: {
      type: String,
      required: true,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3-At18Q5-DvqWAdjwypcYeGnbUA5jehQfWPCpXPH5QS64CPVya_vUqks&s=10",
    },
    stock_quantity: {
      type: Number,
      required: true,
      min: 0, // ป้องกันเผื่อหน้าบ้านส่งจำนวนติดลบมา
      default: 0,
    }, // 🎯 แก้ไขจาก Int32 เป็น Number
    product_price: {
      type: Number,
      required: true,
      min: 0,
    }, // 🎯 เปลี่ยนเป็น Number เพื่อความง่ายในการดึงไปคำนวณใน Node.js ครับ
  },
  { timestamps: true }, // มี createdAt และ updatedAt ให้อัตโนมัติ ดีมากครับ!
);

const Product = mongoose.model("Product", productSchema);
export default Product;
