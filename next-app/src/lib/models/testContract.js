import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, {
  timestamps: true
});

const TestContract = mongoose.models.TestContract || mongoose.model("TestContract", testSchema);
export default TestContract;
