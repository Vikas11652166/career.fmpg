const mongoose = require("mongoose");
const uri = "mongodb://localhost:27017/careers";

// Register mock schemas to population works
const jobSchema = new mongoose.Schema({}, { strict: false });
mongoose.model("Job", jobSchema);

const offerSchema = new mongoose.Schema({}, { strict: false });
mongoose.model("OfferLetter", offerSchema);

const appSchema = new mongoose.Schema({}, { strict: false });
const Application = mongoose.model("Application", appSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected!");
    
    const appId = "6a1d67d2a4b948b2c7bbbe28";
    
    const app = await Application.findById(appId)
      .populate("jobId")
      .populate("offerLetterId")
      .lean();
      
    if (!app) {
      console.log("Application not found.");
      return;
    }
    
    console.log("SUCCESS: Found raw application with population:", JSON.stringify(app, null, 2));
    
    console.log("\nStarting serialization mimic...");
    
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
    
    console.log("SUCCESS: Mimic complete! Serialized object:", JSON.stringify(serialized, null, 2));
    
  } catch (error) {
    console.error("MIMIC ERROR THROWN:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Done.");
  }
}

run();
