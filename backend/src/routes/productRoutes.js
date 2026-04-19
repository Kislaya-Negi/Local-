import { Router } from "express";
import { createProduct, deleteProduct, getProductsByVendor, updateProduct } from "../controllers/productController.js";
import { authRequired, requireRole } from "../middleware/auth.js";

export const productRoutes = Router();

productRoutes.get("/products/:vendorId", getProductsByVendor);
productRoutes.post("/product", authRequired, requireRole("vendor"), createProduct);
productRoutes.patch("/product/:id", authRequired, requireRole("vendor"), updateProduct);
productRoutes.delete("/product/:id", authRequired, requireRole("vendor"), deleteProduct);
