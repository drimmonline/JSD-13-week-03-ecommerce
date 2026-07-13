import jwt from "jsonwebtoken";

// 🛠️ แก้ไข: ดักความปลอดภัยชั้นที่สองด้วยคีย์ลับสำรองชุดเดียวกับตอนเซ็นตั๋ว (Login/Register)
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY_YOUR_MOS_2026";

export const protectRoute = (request, response, next) => {
  try {
    // ดึง token จาก headers "Authorization: Bearer <TOKEN>"
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({ msg: "กรุณาล็อกอินก่อนใช้งานระบบ" });
    }

    const token = authHeader.split(" ")[1];

    // ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, JWT_SECRET);

    // ฝังข้อมูลผู้ใช้ลงใน request เผื่อไปใช้ต่อใน controller
    // โครงสร้างที่ได้จะเป็น { userId, username, account_type } ตรงตามที่ฝังไว้
    request.user = decoded;

    next();
  } catch (err) {
    // ส่งข้อมูล Log ออกมาดูบน Console หลังบ้านเบา ๆ เพื่อช่วย Debug
    console.error("JWT Verification Error:", err.message);
    return response.status(403).json({ msg: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

// 🛡️ Middleware ตรวจสอบสิทธิ์ Admin (ต้องใช้คู่กับ protectRoute)
export const adminOnly = (request, response, next) => {
  if (!request.user || request.user.account_type !== "admin") {
    return response.status(403).json({ msg: "ไม่มีสิทธิ์เข้าถึง เฉพาะ Admin เท่านั้น" });
  }
  next();
};
