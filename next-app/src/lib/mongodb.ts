import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API route usage.
 */
interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCached: MongooseGlobal | undefined;
}

// Ensure cache is always defined (avoids TS18048 possible undefined errors)
if (!globalThis.mongooseCached) {
  globalThis.mongooseCached = { conn: null, promise: null };
}
const cached: MongooseGlobal = globalThis.mongooseCached;

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Connecting to MongoDB via cached pool...");
    cached.promise = mongoose.connect(MONGO_URI!, opts).then((mongooseInstance) => {
      console.log("Successfully connected to MongoDB");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
export { connectDB };
