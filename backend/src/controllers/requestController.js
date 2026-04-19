import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";

function serializeRequest(request) {
  return {
    id: String(request._id),
    type: request.type,
    status: request.status,
    totalAmount: request.totalAmount ?? 0,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    items: (request.items ?? []).map((item) => ({
      productId: String(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    customer: request.customerId
      ? {
          id: String(request.customerId._id ?? request.customerId),
          name: request.customerId.name,
          email: request.customerId.email,
          location: request.customerId.location,
        }
      : null,
    vendor: request.vendorId
      ? {
          id: String(request.vendorId._id ?? request.vendorId),
          name: request.vendorId.name,
          category: request.vendorId.category,
          rating: request.vendorId.rating,
          location: request.vendorId.location,
        }
      : null,
  };
}

async function loadOwnedRequest(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    return { error: { status: 400, message: "Invalid request id" } };
  }

  const filter = user.role === "vendor" ? { _id: id, vendorId: user._id } : { _id: id, customerId: user._id };
  const request = await Request.findOne(filter);
  if (!request) {
    return { error: { status: 404, message: "Request not found" } };
  }

  return { request };
}

export async function createRequest(req, res) {
  const { vendorId, type, items } = req.body ?? {};
  if (!vendorId) return sendError(res, 400, "Missing vendorId");

  if (!mongoose.isValidObjectId(vendorId)) return sendError(res, 400, "Invalid vendorId");

  const vendor = await User.findOne({ _id: vendorId, role: "vendor" }).select("_id");
  if (!vendor) return sendError(res, 404, "Vendor not found");

  const normalizedType = type === "order" ? "order" : "service";
  let normalizedItems = [];
  let totalAmount = 0;

  if (normalizedType === "order") {
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, "Order items are required");
    }

    const cleanedItems = items.map((item) => ({
      productId: item?.productId,
      quantity: Number(item?.quantity),
    }));

    const hasInvalidItem = cleanedItems.some(
      (item) => !mongoose.isValidObjectId(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1
    );
    if (hasInvalidItem) {
      return sendError(res, 400, "Each order item needs a valid productId and quantity.");
    }

    const productIds = [...new Set(cleanedItems.map((item) => String(item.productId)))];
    const products = await Product.find({ _id: { $in: productIds }, vendorId }).select("name price vendorId");
    if (products.length !== productIds.length) {
      return sendError(res, 400, "Some selected products are missing or belong to another vendor.");
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    normalizedItems = cleanedItems.map((item) => {
      const product = productMap.get(String(item.productId));
      const subtotal = Number(product.price) * item.quantity;
      return {
        productId: product._id,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        subtotal,
      };
    });
    totalAmount = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  const request = await Request.create({
    customerId: req.user._id,
    vendorId,
    type: normalizedType,
    status: "pending",
    items: normalizedItems,
    totalAmount,
  });

  await request.populate("customerId", "name email location");
  await request.populate("vendorId", "name category rating location");

  return res.status(201).json({
    request: serializeRequest(request),
  });
}

export async function listRequests(req, res) {
  const filter =
    req.user.role === "vendor"
      ? { vendorId: req.user._id }
      : { customerId: req.user._id };

  const requests = await Request.find(filter)
    .populate("customerId", "name email location")
    .populate("vendorId", "name category rating location")
    .sort({ createdAt: -1 });

  return res.json({
    requests: requests.map(serializeRequest),
  });
}

export async function acceptRequest(req, res) {
  const { id } = req.params;
  const loaded = await loadOwnedRequest(id, req.user);
  if (loaded.error) return sendError(res, loaded.error.status, loaded.error.message);

  const { request } = loaded;
  if (request.status !== "pending") {
    return sendError(res, 409, `Only pending requests can be accepted. Current status: ${request.status}`);
  }

  request.status = "accepted";
  await request.save();
  await request.populate("customerId", "name email location");
  await request.populate("vendorId", "name category rating location");

  return res.json({
    request: serializeRequest(request),
  });
}

export async function updateRequestStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const loaded = await loadOwnedRequest(id, req.user);
  if (loaded.error) return sendError(res, loaded.error.status, loaded.error.message);

  const { request } = loaded;
  const allowedStatuses = req.user.role === "vendor" ? ["accepted", "declined"] : ["cancelled"];
  if (!allowedStatuses.includes(status)) {
    return sendError(res, 400, `Allowed statuses: ${allowedStatuses.join(", ")}`);
  }
  if (request.status !== "pending") {
    return sendError(res, 409, `Only pending requests can be updated. Current status: ${request.status}`);
  }

  request.status = status;
  await request.save();
  await request.populate("customerId", "name email location");
  await request.populate("vendorId", "name category rating location");

  return res.json({ request: serializeRequest(request) });
}

export async function deleteRequest(req, res) {
  const { id } = req.params;
  const loaded = await loadOwnedRequest(id, req.user);
  if (loaded.error) return sendError(res, loaded.error.status, loaded.error.message);

  const { request } = loaded;
  if (request.status !== "pending") {
    return sendError(res, 409, `Only pending requests can be deleted. Current status: ${request.status}`);
  }

  await request.deleteOne();
  return res.status(204).send();
}
