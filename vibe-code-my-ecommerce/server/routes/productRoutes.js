import express from "express";
import { protectRoute, adminOnly } from "../middlewares/authMiddleware.js";

import {
  getAllProduct,
  getProductbyID,
  getBestSellingProducts,
  createProduct,
  updateProductPut,
  updateProductPatch,
  deleteProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

// 🛠️ สินค้าขายดี (ต้องมาก่อน /:id)
productRouter.get("/bestselling", getBestSellingProducts);

productRouter.get("/", getAllProduct);
productRouter.get("/:id", getProductbyID);
productRouter.post("/", protectRoute, adminOnly, createProduct);
productRouter.put("/:id", protectRoute, adminOnly, updateProductPut);
productRouter.patch("/:id", protectRoute, adminOnly, updateProductPatch);
productRouter.delete("/:id", protectRoute, adminOnly, deleteProduct);

export default productRouter;
