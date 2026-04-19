import mongoose from "mongoose";

const RequestItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const RequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, enum: ["service", "order"], default: "service" },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
      index: true,
    },
    items: { type: [RequestItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

RequestSchema.index({ vendorId: 1, status: 1, createdAt: -1 });

export const Request = mongoose.model("Request", RequestSchema);
