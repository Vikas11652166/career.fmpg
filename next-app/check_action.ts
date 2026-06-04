import connectDB from "./src/lib/mongodb";
import { getApplicationDetailAction } from "./src/app/actions/admin";

// Mock the process environment variable for local testing
process.env.MONGO_URI = "mongodb://localhost:27017/careers";

async function run() {
  try {
    await connectDB();
    console.log("Connected to MongoDB via connectDB().");
    
    const targetId = "6a1d67d2a4b948b2c7bbbe28";
    
    // We call the action directly!
    // Since getMeAction() would fail inside ensureAdminOrEmployee, let's trace if it fails due to auth or due to a query/serialization crash.
    console.log("\nExecuting getApplicationDetailAction directly...");
    const res = await getApplicationDetailAction(targetId);
    console.log("RESULT RETURNED BY ACTION:", JSON.stringify(res, null, 2));
    
  } catch (error) {
    console.error("Action execution threw crash error:", error);
  } finally {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
    console.log("Connection closed.");
  }
}

run();
