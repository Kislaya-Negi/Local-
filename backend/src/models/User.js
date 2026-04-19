import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["customer", "vendor"] },
    // Vendor profile fields (only meaningful when role === "vendor")
    category: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
    location: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, category: 1 });

export const User = mongoose.model("User", UserSchema);
