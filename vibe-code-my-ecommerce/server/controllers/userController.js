import User from "../models/users.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// 🛠️ ดักความปลอดภัย: ถ้าดึงจาก .env ไม่สำเร็จ ให้ดึงค่าคีย์ลับสำรองที่คุณตั้งไว้ทันที
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY_YOUR_MOS_2026";

export const getAllUsers = async (request, response) => {
  try {
    const allUsers = await User.find();
    return response.json(allUsers);
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ดึงข้อมูลไม่สำเร็จ: ${err.message}` });
  }
};

// 2. ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้รายคน (GET by ID)
export const getUserById = async (request, response) => {
  try {
    const { id } = request.params;
    const userdata = await User.findOne({ _id: id });

    if (!userdata) {
      return response.status(404).json({ msg: `ไม่พบข้อมูลผู้ใช้` });
    }
    return response.json(userdata);
  } catch (err) {
    return response.status(500).json({ msg: `ไม่สำเร็จ ${err.message}` });
  }
};

// 3. ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่ (POST) - ทำหน้าที่เป็น Register
export const createUser = async (request, response) => {
  try {
    const { password, ...otherData } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      ...otherData,
      account_type: otherData.account_type || "student", // 🛠️ แก้ไข: ใส่สิทธิ์เริ่มต้นป้องกันสิทธิ์ว่างจนโดน 403
      password: hashedPassword,
      _id: uuidv4(),
    });

    const savedUser = await newUser.save();
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    // เพื่อความชัวร์และรองรับหน้าบ้าน: เสริมฟิลด์ userId ให้ตรงกับโครงสร้างของระบบ Token
    userResponse.userId = userResponse._id;

    return response
      .status(201)
      .json({ msg: "สร้างผู้ใช้สำเร็จ", data: userResponse });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `สร้างผู้ใช้ไม่สำเร็จ: ${err.message}` });
  }
};

export const updateUserPut = async (request, response) => {
  try {
    const userId = request.params.id;
    const newData = request.body;

    const updatedUser = await User.findOneAndReplace({ _id: userId }, newData, {
      returnDocument: "after",
    });

    if (!updatedUser) {
      return response.status(404).json({ msg: `ไม่พบผู้ใช้ไอดี: ${userId}` });
    }

    return response.json({ msg: "อัปเดตข้อมูลสำเร็จ", data: updatedUser });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `อัปเดตข้อมูลไม่สำเร็จ: ${err.message}` });
  }
};

// 4. ฟังก์ชันสำหรับอัปเดตข้อมูลแบบ PATCH
export const updateUserPatch = async (request, response) => {
  try {
    const userId = request.params.id;
    const { profile, ...otherData } = request.body;

    let updateFields = { ...otherData };

    if (profile) {
      for (const key in profile) {
        updateFields[`profile.${key}`] = profile[key];
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!updatedUser) {
      return response.status(404).json({ msg: `ไม่พบผู้ใช้ไอดี: ${userId}` });
    }

    return response.json({ msg: "อัปเดตข้อมูลสำเร็จ", data: updatedUser });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `อัปเดตไม่สำเร็จ: ${err.message}` });
  }
};

// 6. ฟังก์ชันสำหรับลบผู้ใช้ (DELETE)
export const deleteUser = async (request, response) => {
  try {
    const userId = request.params.id;

    const deletedUser = await User.findOneAndDelete({ _id: userId });

    if (!deletedUser) {
      return response
        .status(404)
        .json({ msg: `ไม่พบผู้ใช้ไอดีที่ต้องการลบ: ${userId}` });
    }

    return response.json({
      msg: "ลบข้อมูลผู้ใช้เรียบร้อยแล้ว",
      deletedData: deletedUser,
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `ลบข้อมูลไม่สำเร็จ: ${err.message}` });
  }
};

// ===== ฟังก์ชันล็อกอิน =====
export const loginUsers = async (request, response) => {
  try {
    const { username, password } = request.body;
    const user = await User.findOne({ username });
    if (!user) {
      return response
        .status(401)
        .json({ msg: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response
        .status(401)
        .json({ msg: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const tokenPayload = {
      userId: user._id,
      username: user.username,
      account_type: user.account_type || "student", // ดักความปลอดภัยอีกชั้นหนึ่ง
    };

    const finalSecret =
      JWT_SECRET || process.env.JWT_SECRET || "SECRET_KEY_YOUR_MOS_2026";

    const token = jwt.sign(tokenPayload, finalSecret, { expiresIn: "1d" });

    return response.json({
      msg: "เข้าสู่ระบบสำเร็จ 🎉",
      accessToken: token,
    });
  } catch (err) {
    return response
      .status(500)
      .json({ msg: `เกิดข้อผิดพลาดในการล็อกอิน: ${err.message}` });
  }
};
