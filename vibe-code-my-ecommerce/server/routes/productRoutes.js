import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js"; // อิมพอร์ตมาดักประตู

import {
  getAllProduct,
  getProductbyID,
  createProduct,
  updateProductPut,
  updateProductPatch,
  deleteProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get("/", getAllProduct);
productRouter.get("/:id", getProductbyID);
productRouter.post("/", protectRoute, createProduct);
productRouter.put("/:id", protectRoute, updateProductPut);
productRouter.patch("/:id", updateProductPatch);
productRouter.delete("/:id", deleteProduct);

export default productRouter;
