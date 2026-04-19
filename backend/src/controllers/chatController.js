import mongoose from "mongoose";
import { Chat } from "../models/Chat.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/http.js";

function serializeChat(chat, currentUserId) {
  const current = String(currentUserId);
  const messages = (chat.messages ?? []).map((message) => ({
    id: String(message._id),
    text: message.text,
    createdAt: message.createdAt,
    sender: message.senderId
      ? {
          id: String(message.senderId._id ?? message.senderId),
          name: message.senderId.name,
          role: message.senderId.role,
        }
      : null,
    isOwn: String(message.senderId?._id ?? message.senderId) === current,
  }));

  return {
    id: String(chat._id),
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    lastMessageAt: chat.lastMessageAt,
    customer: chat.customerId
      ? {
          id: String(chat.customerId._id ?? chat.customerId),
          name: chat.customerId.name,
          location: chat.customerId.location,
        }
      : null,
    vendor: chat.vendorId
      ? {
          id: String(chat.vendorId._id ?? chat.vendorId),
          name: chat.vendorId.name,
          category: chat.vendorId.category,
          location: chat.vendorId.location,
          phone: chat.vendorId.phone,
          email: chat.vendorId.email,
        }
      : null,
    messages,
    preview: messages.length ? messages[messages.length - 1].text : "",
  };
}

async function populateChat(chat) {
  await chat.populate("customerId", "name location");
  await chat.populate("vendorId", "name category location phone email");
  await chat.populate("messages.senderId", "name role");
  return chat;
}

async function resolveParticipants(currentUser, otherUserId) {
  if (!mongoose.isValidObjectId(otherUserId)) {
    return { error: { status: 400, message: "Invalid user id" } };
  }

  const otherUser = await User.findById(otherUserId).select("name role location category phone email");
  if (!otherUser) {
    return { error: { status: 404, message: "User not found" } };
  }

  if (String(otherUser._id) === String(currentUser._id)) {
    return { error: { status: 400, message: "Cannot start a chat with yourself" } };
  }

  if (otherUser.role === currentUser.role) {
    return { error: { status: 400, message: "Chats are only available between customers and vendors." } };
  }

  const customerId = currentUser.role === "customer" ? currentUser._id : otherUser._id;
  const vendorId = currentUser.role === "vendor" ? currentUser._id : otherUser._id;

  return { customerId, vendorId };
}

async function getOrCreateChat(currentUser, otherUserId) {
  const participants = await resolveParticipants(currentUser, otherUserId);
  if (participants.error) return participants;

  let chat = await Chat.findOne({
    customerId: participants.customerId,
    vendorId: participants.vendorId,
  });

  if (!chat) {
    chat = await Chat.create({
      customerId: participants.customerId,
      vendorId: participants.vendorId,
      messages: [],
      lastMessageAt: new Date(),
    });
  }

  await populateChat(chat);
  return { chat };
}

export async function listChats(req, res) {
  const filter = req.user.role === "vendor" ? { vendorId: req.user._id } : { customerId: req.user._id };
  const chats = await Chat.find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("customerId", "name location")
    .populate("vendorId", "name category location phone email")
    .populate("messages.senderId", "name role");

  return res.json({
    chats: chats.map((chat) => serializeChat(chat, req.user._id)),
  });
}

export async function getChat(req, res) {
  const { otherUserId } = req.params;
  const result = await getOrCreateChat(req.user, otherUserId);
  if (result.error) return sendError(res, result.error.status, result.error.message);

  return res.json({
    chat: serializeChat(result.chat, req.user._id),
  });
}

export async function sendChatMessage(req, res) {
  const { otherUserId } = req.params;
  const text = String(req.body?.text ?? "").trim();
  if (!text) return sendError(res, 400, "Message text is required");

  const result = await getOrCreateChat(req.user, otherUserId);
  if (result.error) return sendError(res, result.error.status, result.error.message);

  const { chat } = result;
  chat.messages.push({
    senderId: req.user._id,
    text,
    createdAt: new Date(),
  });
  chat.lastMessageAt = new Date();
  await chat.save();
  await populateChat(chat);

  return res.status(201).json({
    chat: serializeChat(chat, req.user._id),
  });
}
