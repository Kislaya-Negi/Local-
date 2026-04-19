import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";

function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, { subject: String(userId), expiresIn: "7d" });
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value) {
  return String(value ?? "").trim();
}

export async function signup(req, res) {
  const { name, email, password, role, category, location, phone } = req.body ?? {};
  if (!name || !email || !password || !role) {
    return sendError(res, 400, "Missing required fields", {
      required: ["name", "email", "password", "role"],
    });
  }
  if (!["customer", "vendor"].includes(role)) return sendError(res, 400, "Invalid role");
  if (role === "vendor" && (!category || !location || !phone)) {
    return sendError(res, 400, "Missing vendor fields", { required: ["category", "location", "phone"] });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return sendError(res, 400, "Please provide a valid email address.");
  }
  if (role === "vendor" && normalizedPhone.length < 7) {
    return sendError(res, 400, "Please provide a valid phone number for vendors.");
  }

  const existing = await User.findOne({ email: normalizedEmail }).select("_id").lean();
  if (existing) {
    return sendError(
      res,
      409,
      "An account with this email already exists. Try logging in or use a different email.",
      { email: normalizedEmail }
    );
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  let user;
  try {
    user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      ...(role === "vendor"
        ? {
            category: String(category).trim(),
            location: String(location).trim(),
            phone: normalizedPhone,
            rating: 4.5,
          }
        : { location: location ? String(location).trim() : "", phone: normalizedPhone }),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return sendError(
        res,
        409,
        `An account with the email "${normalizedEmail}" already exists. Try logging in.`,
        { email: normalizedEmail }
      );
    }
    throw err;
  }

  const token = signToken(user._id);
  return res.status(201).json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      rating: user.rating,
      location: user.location,
      phone: user.phone,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return sendError(res, 400, "Missing email or password");

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return sendError(res, 400, "Please provide a valid email address.");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return sendError(res, 401, "Invalid credentials");

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return sendError(res, 401, "Invalid credentials");

  const token = signToken(user._id);
  return res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      rating: user.rating,
      location: user.location,
      phone: user.phone,
    },
  });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
