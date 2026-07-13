import Cart from "../models/carts.js";
import Product from "../models/products.js";
import { v4 as uuidv4 } from "uuid";

// เพิ่มสินค้าลงตะกร้า (สร้างตะกร้าใหม่ถ้ายังไม่มี)
export const addToCart = async (request, response) => {
  try {
    const { product_id, quantity } = request.body;
    const userId = request.user.userId;

    // ตรวจสอบว่าสินค้ามีอยู่จริงและมีสต็อกเพียงพอ
    const product = await Product.findOne({ _id: product_id });
    if (!product) {
      return response.status(404).json({ msg: "ไม่พบสินค้าในระบบ" });
    }
    if (product.stock_quantity <= 0) {
      return response.status(400).json({ msg: "สินค้าหมดแล้ว" });
    }

    // ค้นหาตะกร้าของผู้ใช้
    let cart = await Cart.findOne({ user_id: userId });

    // ถ้ายังไม่มีตะกร้า ให้สร้างใหม่
    if (!cart) {
      cart = new Cart({
        _id: uuidv4(),
        user_id: userId,
        items: [{ product_id, quantity }],
      });
      await cart.save();
      return response
        .status(201)
        .json({ msg: "เพิ่มสินค้าลงตะกร้าเรียบร้อย", data: cart });
    }

    // ถ้ามีตะกร้าอยู่แล้ว เช็กว่ามีสินค้าชิ้นนี้อยู่หรือยัง
    const itemIndex = cart.items.findIndex(
      (item) => item.product_id === product_id,
    );

    if (itemIndex > -1) {
      // มีอยู่แล้ว: ตรวจสอบไม่ให้เกินสต็อก (จำกัดสูงสุด 10 ชิ้นต่อรายการ)
      const newQty = cart.items[itemIndex].quantity + quantity;
      if (newQty > 10) {
        return response.status(400).json({ msg: "จำกัดจำนวนสินค้าสูงสุด 10 ชิ้นต่อรายการ" });
      }
      if (newQty > product.stock_quantity) {
        return response.status(400).json({ msg: `สินค้าในสต็อกไม่เพียงพอ (เหลือ ${product.stock_quantity} ชิ้น)` });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      // ยังไม่มี: เพิ่มรายการใหม่
      if (quantity > product.stock_quantity) {
        return response.status(400).json({ msg: `สินค้าในสต็อกไม่เพียงพอ (เหลือ ${product.stock_quantity} ชิ้น)` });
      }
      cart.items.push({ product_id, quantity });
    }

    await cart.save();
    return response.json({ msg: "อัปเดตตะกร้าสินค้าสำเร็จ", data: cart });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `เพิ่มลงตะกร้าไม่สำเร็จ: ${err.message}` });
  }
};

// ดูตะกร้าสินค้าของผู้ใช้ (พร้อมข้อมูลสินค้า)
export const getMyCart = async (request, response) => {
  try {
    const userId = request.user.userId;
    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      return response.json({ items: [] });
    }

    // ดึงข้อมูลสินค้าแต่ละรายการจาก Product model (แทน populate ที่ไม่ทำงานกับ String ref)
    const enrichedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findOne({ _id: item.product_id });
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          product: product
            ? {
                product_name: product.product_name,
                product_price: product.product_price,
                product_image: product.product_image,
                stock_quantity: product.stock_quantity,
              }
            : null,
        };
      }),
    );

    return response.json({
      _id: cart._id,
      user_id: cart.user_id,
      items: enrichedItems,
      timestamps: cart.timestamps,
    });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// อัปเดตจำนวนสินค้าในตะกร้า
export const updateQuantity = async (request, response) => {
  try {
    const { product_id, quantity } = request.body;
    const userId = request.user.userId;

    // ถ้าจำนวนน้อยกว่า 1 ให้ลบรายการนั้นออก
    if (quantity < 1) {
      return removeFromCart(request, response);
    }

    // ตรวจสอบสต็อกสินค้า
    const product = await Product.findOne({ _id: product_id });
    if (!product) {
      return response.status(404).json({ msg: "ไม่พบสินค้าในระบบ" });
    }
    if (quantity > 10) {
      return response.status(400).json({ msg: "จำกัดจำนวนสินค้าสูงสุด 10 ชิ้นต่อรายการ" });
    }
    if (quantity > product.stock_quantity) {
      return response.status(400).json({ msg: `สินค้าในสต็อกไม่เพียงพอ (เหลือ ${product.stock_quantity} ชิ้น)` });
    }

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return response.status(404).json({ msg: "ไม่พบตะกร้าสินค้า" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product_id === product_id,
    );

    if (itemIndex === -1) {
      return response.status(404).json({ msg: "ไม่พบสินค้านี้ในตะกร้า" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return response.json({ msg: "อัปเดตจำนวนสำเร็จ", data: cart });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};

// ลบสินค้า khỏiตะกร้า
export const removeFromCart = async (request, response) => {
  try {
    const { product_id } = request.body;
    const userId = request.user.userId;

    const updatedCart = await Cart.findOneAndUpdate(
      { user_id: userId },
      { $pull: { items: { product_id: product_id } } },
      { returnDocument: "after" },
    );

    if (!updatedCart) {
      return response.status(404).json({ msg: "ไม่พบตะกร้าสินค้าของผู้ใช้รายนี้" });
    }

    return response.json({
      msg: "ลบสินค้าออกจากตะกร้าสำเร็จแล้ว",
      data: updatedCart,
    });
  } catch (err) {
    return response.status(500).json({ msg: `ไม่สามารถลบสินค้าได้: ${err.message}` });
  }
};

// ล้างตะกร้าสินค้าทั้งหมด
export const clearCart = async (request, response) => {
  try {
    const userId = request.user.userId;

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return response.status(404).json({ msg: "ไม่พบตะกร้าสินค้า" });
    }

    cart.items = [];
    await cart.save();

    return response.json({ msg: "ล้างตะกร้าสินค้าสำเร็จ", data: cart });
  } catch (err) {
    return response.status(500).json({ msg: err.message });
  }
};
