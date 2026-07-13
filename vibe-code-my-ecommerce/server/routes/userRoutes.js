import express from "express";

// 💡 ลองเช็กให้ชัวร์ว่าในโฟลเดอร์ชื่อ userController.js (C ใหญ่) หรือ usercontroller.js (c เล็ก) แล้วพิมพ์ให้ตรงกันนะครับ
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUserPut,
  deleteUser,
  updateUserPatch,
  loginUsers,
} from "../controllers/userController.js";

// 💡 ปรับเปลี่ยนชื่อตัวแปรตรงนี้ให้กลายเป็น userRouter ให้สอดคล้องกันทั้งหมดครับ
const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);
userRouter.put("/:id", updateUserPut);
userRouter.patch("/:id", updateUserPatch);
userRouter.delete("/:id", deleteUser);
userRouter.post("/login", loginUsers);
export default userRouter;
