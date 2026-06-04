const mongoose = require("mongoose");
const uri = "mongodb://localhost:27017/careers";

async function run() {
  try {
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    
    // We register the Application model dynamically
    const appSchema = new mongoose.Schema({}, { strict: false });
    const Application = mongoose.models.Application || mongoose.model("Application", appSchema);
    
    const count = await Application.countDocuments({});
    console.log("Total candidate applications in DB:", count);
    
    const sample = await Application.find({}).limit(5).select("_id fullName email");
    console.log("Sample applications in DB:");
    sample.forEach(s => {
      console.log(`- ID: ${s._id.toString()}, Name: ${s.get("fullName") || "N/A"}, Email: ${s.get("email") || "N/A"}`);
    });
    
    const targetId = "6a1d67d2a4b948b2c7bbbe28";
    const target = await Application.findById(targetId);
    console.log(`\nQuerying application with ID: ${targetId}...`);
    if (target) {
      console.log("SUCCESS: Found application:", target);
    } else {
      console.log("NOT FOUND: No application matches this ID.");
    }
  } catch (error) {
    console.error("Diagnostic script error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("DB connection closed.");
  }
}

run();
