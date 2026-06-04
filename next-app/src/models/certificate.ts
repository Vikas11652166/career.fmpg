import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  recipientEmail?: string;
  domain: string;
  jobrole: string;
  fromDate: Date;
  toDate: Date;
  issuedBy: string;
  issuedOn: Date;
}

const certificateSchema = new Schema<ICertificate>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  recipientEmail: { type: String },
  domain: { type: String, required: true },
  jobrole: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  issuedBy: { type: String, default: "FMPG" },
  issuedOn: { type: Date, default: Date.now }
});

const Certificate: Model<ICertificate> = mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", certificateSchema);

export default Certificate;
export { Certificate };
