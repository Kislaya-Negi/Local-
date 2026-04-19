import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";

export async function listVendors(req, res) {
  const vendors = await User.find({ role: "vendor" })
    .select("name category rating location email phone")
    .sort({ rating: -1, createdAt: -1 });

  return res.json({
    vendors: vendors.map((v) => ({
      id: String(v._id),
      name: v.name,
      category: v.category,
      rating: v.rating,
      location: v.location,
      email: v.email,
      phone: v.phone,
    })),
  });
}

export async function getVendor(req, res) {
  const { id } = req.params;
  const vendor = await User.findOne({ _id: id, role: "vendor" }).select("name category rating location email phone");
  if (!vendor) return sendError(res, 404, "Vendor not found");

  return res.json({
    vendor: {
      id: String(vendor._id),
      name: vendor.name,
      category: vendor.category,
      rating: vendor.rating,
      location: vendor.location,
      email: vendor.email,
      phone: vendor.phone,
    },
  });
}
