import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { sendError } from "../utils/http.js";

export async function getProductsByVendor(req, res) {
  const { vendorId } = req.params;
  const products = await Product.find({ vendorId }).select("name price description vendorId").sort({ createdAt: -1 });
  return res.json({
    products: products.map((p) => ({
      id: String(p._id),
      name: p.name,
      price: p.price,
      description: p.description,
      vendorId: String(p.vendorId),
    })),
  });
}

export async function createProduct(req, res) {
  const { name, price, description } = req.body ?? {};
  if (!name || price === undefined) {
    return sendError(res, 400, "Missing required fields", { required: ["name", "price"] });
  }

  const product = await Product.create({
    name: String(name).trim(),
    price: Number(price),
    description: description ? String(description).trim() : "",
    vendorId: req.user._id,
  });

  return res.status(201).json({
    product: {
      id: String(product._id),
      name: product.name,
      price: product.price,
      description: product.description,
      vendorId: String(product.vendorId),
    },
  });
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, price, description } = req.body ?? {};

  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid product id");
  if (!name || price === undefined) {
    return sendError(res, 400, "Missing required fields", { required: ["name", "price"] });
  }

  const product = await Product.findOne({ _id: id, vendorId: req.user._id });
  if (!product) return sendError(res, 404, "Product not found");

  product.name = String(name).trim();
  product.price = Number(price);
  product.description = description ? String(description).trim() : "";
  await product.save();

  return res.json({
    product: {
      id: String(product._id),
      name: product.name,
      price: product.price,
      description: product.description,
      vendorId: String(product.vendorId),
    },
  });
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "Invalid product id");

  const product = await Product.findOne({ _id: id, vendorId: req.user._id });
  if (!product) return sendError(res, 404, "Product not found");

  await product.deleteOne();
  return res.status(204).send();
}
