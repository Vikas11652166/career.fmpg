const mongoose = require("mongoose");
const uri = "mongodb://localhost:27017/careers";

// 1. Properly register schemas with fields for populate
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  type: String,
  salary: String,
  department: String,
  description: String,
  requirements: [String],
  responsibilities: [String],
  hrContact: mongoose.Schema.Types.Mixed
}, { strict: false });
mongoose.model("Job", jobSchema);

const offerSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  validUntil: Date,
  issuedOn: Date
}, { strict: false });
mongoose.model("OfferLetter", offerSchema);

const appSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  offerLetterId: { type: mongoose.Schema.Types.ObjectId, ref: "OfferLetter" },
  fullName: String,
  email: String,
  phone: String,
  experience: String,
  education: String,
  skills: [String],
  coverLetter: String,
  questionAnswers: mongoose.Schema.Types.Mixed,
  status: String,
  userId: mongoose.Schema.Types.ObjectId
}, { strict: false });
const Application = mongoose.model("Application", appSchema);

async function run() {
  try {
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    
    const appId = "6a1d67d2a4b948b2c7bbbe28";
    
    console.log(`\nQuerying application with ID: ${appId} and populating...`);
    const app = await Application.findById(appId)
      .populate("jobId")
      .populate("offerLetterId")
      .lean();
      
    if (!app) {
      console.log("NOT FOUND: Application not found.");
      return;
    }
    
    console.log("RAW POPULATED RESULT:", JSON.stringify(app, null, 2));
    
    console.log("\nTesting serialization code...");
    const serialized = {
      ...app,
      _id: app._id.toString(),
      jobId: app.jobId ? {
        ...app.jobId,
        _id: app.jobId._id.toString(),
        title: app.jobId.title,
        company: app.jobId.company,
        location: app.jobId.location,
        type: app.jobId.type,
        salary: app.jobId.salary,
        department: app.jobId.department,
        description: app.jobId.description,
        requirements: app.jobId.requirements || [],
        responsibilities: app.jobId.responsibilities || [],
        hrContact: app.jobId.hrContact,
        createdAt: app.jobId.createdAt?.toISOString(),
        updatedAt: app.jobId.updatedAt?.toISOString()
      } : null,
      offerLetterId: app.offerLetterId ? {
        ...app.offerLetterId,
        _id: app.offerLetterId._id.toString(),
        startDate: app.offerLetterId.startDate?.toISOString(),
        endDate: app.offerLetterId.endDate?.toISOString(),
        validUntil: app.offerLetterId.validUntil?.toISOString(),
        issuedOn: app.offerLetterId.issuedOn?.toISOString()
      } : null,
      userId: app.userId ? app.userId.toString() : null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString()
    };
    
    console.log("SERIALIZED RESULT SUCCESSFULLY CREATED:", JSON.stringify(serialized, null, 2));
    
  } catch (error) {
    console.error("CRASH ERROR DETECTED:", error);
  } finally {
    await mongoose.connection.close();
    console.log("DB connection closed.");
  }
}

run();
