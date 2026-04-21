import mongoose from "mongoose";

const globalMongoose = globalThis;
const cache =
  globalMongoose.__localinkMongoose ??
  (globalMongoose.__localinkMongoose = {
    connection: null,
    promise: null,
  });

function describeMongoUri(mongoUri) {
  try {
    const url = new URL(mongoUri);
    return `${url.protocol}//${url.hostname}${url.pathname || ""}`;
  } catch {
    return "MongoDB";
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableMongoError(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    error?.name === "MongoNetworkError" ||
    message.includes("tlsv1 alert internal error") ||
    message.includes("ssl routines") ||
    message.includes("connection") ||
    message.includes("timed out")
  );
}

export async function connectDb(mongoUri) {
  mongoose.set("strictQuery", true);

  if (cache.connection) {
    return cache.connection;
  }

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required. Add your MongoDB Atlas connection string before starting the backend.");
  }

  if (!cache.promise) {
    cache.promise = (async () => {
      const maxAttempts = 5;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const connection = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10_000,
          });
          console.log("Connected to MongoDB:", describeMongoUri(mongoUri));
          return connection;
        } catch (error) {
          const shouldRetry = attempt < maxAttempts && isRetryableMongoError(error);
          if (!shouldRetry) {
            throw error;
          }

          console.warn(
            `MongoDB connection attempt ${attempt} failed (${error.message}). Retrying in 2 seconds...`
          );
          await wait(2_000);
        }
      }

      throw new Error("MongoDB connection failed after multiple attempts.");
    })().catch((error) => {
      cache.promise = null;
      throw error;
    });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}

export async function disconnectDb() {
  cache.connection = null;
  cache.promise = null;
  await mongoose.disconnect();
}
