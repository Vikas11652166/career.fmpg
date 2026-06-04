"use server";

import connectDB from "@/lib/mongodb";
import OfferLetter from "@/models/offerLetter";
import EmploymentContract from "@/models/offerContract";
import Application from "@/models/application";
import User from "@/models/user";
import Job from "@/models/job";
import AuditLog from "@/models/auditLog";
import Notification from "@/models/notification";
import EmailService from "@/services/emailService";
import PDFService from "@/services/pdfService";
import mongoose from "mongoose";
import { getMeAction } from "./auth";

/**
 * Retrieves a pending offer letter by ID for signing.
 */
export async function getOfferForAcceptanceAction(offerId: string) {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return { success: false, message: "Invalid offer letter identifier", data: null };
    }

    const offer = await OfferLetter.findById(offerId).lean();
    if (!offer) {
      return { success: false, message: "Offer letter not found", data: null };
    }

    if (offer.status !== "Pending") {
      return { success: false, message: `This offer has already been ${offer.status.toLowerCase()}`, data: null };
    }

    // Check expiration
    if (new Date() > new Date(offer.validUntil)) {
      return { success: false, message: "This offer has expired", data: null };
    }

    // Serialize
    const serialized = {
      ...offer,
      _id: offer._id.toString(),
      userId: offer.userId ? offer.userId.toString() : undefined,
      applicationId: offer.applicationId ? offer.applicationId.toString() : undefined,
      startDate: offer.startDate.toISOString(),
      validUntil: offer.validUntil.toISOString(),
      issuedOn: offer.issuedOn.toISOString(),
    };

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get offer action failed:", error);
    return { success: false, message: error.message || "Failed to load offer letter", data: null };
  }
}

/**
 * Accepts an offer letter, submits signed bank/address details, and generates employee records.
 */
export async function submitContractSignatureAction(offerId: string, contractData: any): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) {
      return { success: false, message: "Unauthenticated action. Please log in first." };
    }

    const offer = await OfferLetter.findById(offerId);
    if (!offer) {
      return { success: false, message: "Offer letter record not found" };
    }

    if (offer.status !== "Pending") {
      return { success: false, message: `Offer has already been processed: ${offer.status}` };
    }

    if (new Date() > new Date(offer.validUntil)) {
      return { success: false, message: "Offer validity period has expired" };
    }

    // 1. Create the Employment Contract record
    const newContract = await EmploymentContract.create({
      offerLetterId: offer._id,
      applicationId: offer.applicationId,
      candidateName: offer.candidateName,
      email: offer.email,
      phone: contractData.phone,
      personalInfo: contractData.personalInfo,
      bankingInfo: contractData.bankingInfo,
      employmentDetails: {
        position: offer.position,
        department: offer.department,
        salary: offer.salary,
        startDate: offer.startDate,
        joiningLocation: offer.joiningLocation || "Hoshiarpur",
        workType: offer.workType,
        reportingManager: offer.reportingManager,
      },
      status: "Under_Review",
      workflowStatus: {
        currentStage: "submitted",
        submittedAt: new Date(),
        stages: {
          submitted: {
            completedAt: new Date(),
            completedBy: offer.email,
          }
        }
      },
      acceptanceComments: contractData.acceptanceComments,
      agreementTerms: {
        termsAccepted: contractData.termsAccepted,
        privacyPolicyAccepted: contractData.privacyPolicyAccepted,
        acceptedAt: new Date(),
        ipAddress: contractData.ipAddress || "127.0.0.1"
      }
    });

    // 2. Link contract and update offer letter status
    offer.status = "Accepted";
    offer.acceptedAt = new Date();
    offer.contractId = newContract._id;
    await offer.save();

    // 3. Auto-hire post acceptance: update User fields and auto-generate employeeId
    const user = await User.findOne({ email: offer.email });
    if (user) {
      user.status = "active";
      user.offerLetter = offer._id;
      user.position = offer.position;
      user.department = offer.department;
      user.reportingManager = offer.reportingManager || "FMPG HR Team";
      
      // Auto-generate next employee serial EMP001
      if (!user.employeeId) {
        const employeeCount = await User.countDocuments({ 
          status: "active",
          employeeId: { $exists: true, $ne: null }
        });
        user.employeeId = `EMP${String(employeeCount + 1).padStart(3, '0')}`;
      }

      await user.save();
    }

    // 4. Update the parent Application status to "hired"
    if (offer.applicationId) {
      await Application.findByIdAndUpdate(offer.applicationId, { status: "hired" });
    }

    // 5. Send SMTP email confirmation
    try {
      await EmailService.sendContractSubmissionConfirmation({
        candidateName: offer.candidateName,
        email: offer.email,
        position: offer.position,
      });
    } catch (emailErr) {
      console.error("Failed to send contract confirmation email:", emailErr);
    }

    // 6. Log Audit action
    try {
      await AuditLog.create({
        actor: meRes.data.id,
        actorRole: meRes.data.role,
        action: "ACCEPT",
        resourceEntity: "OfferLetter",
        resourceId: offer._id,
        changes: { contractId: newContract._id, status: "Accepted" }
      });
    } catch (auditErr) {}

    // 7. Notify HR staff
    try {
      const HRUsers = await User.find({ 
        role: { $in: ["admin", "super-admin", "employee"] } 
      }).select("_id");

      const notificationPromises = HRUsers.map((hr) => {
        return Notification.create({
          userId: hr._id,
          type: "application_status",
          title: "Contract Agreement Submitted",
          message: `${offer.candidateName} has accepted their offer letter and submitted the contract for review.`,
          relatedJobId: offer.applicationId ? undefined : undefined,
          relatedApplicationId: offer.applicationId,
          priority: "high"
        });
      });

      await Promise.all(notificationPromises);
    } catch (notifErr) {}

    return { success: true, message: "Offer accepted and employment contract submitted successfully!" };
  } catch (error: any) {
    console.error("Submit contract signature error:", error);
    return { success: false, message: error.message || "Failed to submit contract" };
  }
}

/**
 * Rejects an offer letter (Candidate action).
 */
export async function rejectOfferAction(offerId: string, reason: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) {
      return { success: false, message: "Unauthenticated action." };
    }

    const offer = await OfferLetter.findById(offerId);
    if (!offer) {
      return { success: false, message: "Offer letter not found" };
    }

    if (offer.status !== "Pending") {
      return { success: false, message: "This offer has already been processed" };
    }

    offer.status = "Rejected";
    offer.rejectedAt = new Date();
    offer.acceptanceComments = reason;
    await offer.save();

    // Update parent Application status to "rejected"
    if (offer.applicationId) {
      await Application.findByIdAndUpdate(offer.applicationId, { status: "rejected" });
    }

    // Log audit
    try {
      await AuditLog.create({
        actor: meRes.data.id,
        actorRole: meRes.data.role,
        action: "REJECT",
        resourceEntity: "OfferLetter",
        resourceId: offer._id,
        changes: { status: "Rejected", comments: reason }
      });
    } catch (auditErr) {}

    // Notify HR
    try {
      const HRUsers = await User.find({ 
        role: { $in: ["admin", "super-admin", "employee"] } 
      }).select("_id");

      const notificationPromises = HRUsers.map((hr) => {
        return Notification.create({
          userId: hr._id,
          type: "application_status",
          title: "Offer Letter Rejected",
          message: `${offer.candidateName} has declined the employment offer for "${offer.position}".`,
          relatedApplicationId: offer.applicationId,
          priority: "high"
        });
      });

      await Promise.all(notificationPromises);
    } catch (notifErr) {}

    return { success: true, message: "Offer rejected successfully." };
  } catch (error: any) {
    console.error("Reject offer error:", error);
    return { success: false, message: error.message || "Failed to reject offer" };
  }
}

/**
 * Gets all offer letters issued (Admin only).
 */
export async function getAllOfferLettersAction() {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !["admin", "super-admin", "employee"].includes(meRes.data.role)) {
      throw new Error("Unauthorized access");
    }

    const offers = await OfferLetter.find()
      .sort({ issuedOn: -1 })
      .lean();

    const serialized = offers.map((o: any) => ({
      ...o,
      _id: o._id.toString(),
      userId: o.userId ? o.userId.toString() : null,
      applicationId: o.applicationId ? o.applicationId.toString() : null,
      contractId: o.contractId ? o.contractId.toString() : null,
      startDate: o.startDate.toISOString(),
      validUntil: o.validUntil.toISOString(),
      issuedOn: o.issuedOn.toISOString(),
      acceptedAt: o.acceptedAt ? o.acceptedAt.toISOString() : null,
      rejectedAt: o.rejectedAt ? o.rejectedAt.toISOString() : null,
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get all offer letters failed:", error);
    return { success: false, message: error.message || "Failed to load offer letters", data: [] };
  }
}

/**
 * Downloads an offer letter as Base64 string for direct client conversion (Admin & Candidate).
 */
export async function downloadOfferLetterBase64Action(id: string) {
  try {
    await connectDB();
    const offer = await OfferLetter.findById(id);

    if (!offer) {
      return { success: false, message: "Offer letter not found", data: null };
    }

    let jobData: any = null;
    if (offer.applicationId) {
      const app = await Application.findById(offer.applicationId);
      if (app && app.jobId) {
        jobData = await Job.findById(app.jobId);
      }
    }

    const job = jobData || {
      title: offer.position,
      type: offer.workType,
      location: offer.joiningLocation,
      salary: offer.salary
    };

    const pdfBuffer = await PDFService.generateOfferLetter(offer, job);
    const base64 = pdfBuffer.toString("base64");

    return { success: true, data: base64 };
  } catch (error: any) {
    console.error("Download offer letter failed:", error);
    return { success: false, message: error.message || "Failed to download offer letter", data: null };
  }
}

function normalizeOfferLetterLookupId(rawId = "") {
  return String(rawId).trim().replace(/^(FMPG-OFF-|FMPG-)/i, "");
}

/**
 * Publicly verifies an offer letter by ID or short ID.
 */
export async function verifyOfferLetterAction(rawId: string) {
  try {
    await connectDB();
    const offerId = normalizeOfferLetterLookupId(rawId);
    let offer: any = null;

    if (mongoose.Types.ObjectId.isValid(offerId)) {
      offer = await OfferLetter.findById(offerId).lean();
    } else {
      // Lookup using shortId (last 6 characters of ObjectId uppercase)
      offer = await OfferLetter.findOne({
        shortId: offerId.toUpperCase()
      }).lean();

      // Fallback for partial/ends-with lookup
      if (!offer && offerId.length >= 4) {
        offer = await OfferLetter.findOne({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: offerId + "$",
              options: "i"
            }
          }
        }).lean();
      }
    }

    if (!offer) {
      return { success: false, message: "Offer letter not found or ID is invalid.", data: null };
    }

    // Serialize Dates for safe propagation to client
    const serialized = {
      ...offer,
      _id: offer._id.toString(),
      userId: offer.userId ? offer.userId.toString() : null,
      applicationId: offer.applicationId ? offer.applicationId.toString() : null,
      contractId: offer.contractId ? offer.contractId.toString() : null,
      startDate: offer.startDate.toISOString(),
      validUntil: offer.validUntil.toISOString(),
      issuedOn: offer.issuedOn.toISOString(),
      acceptedAt: offer.acceptedAt ? offer.acceptedAt.toISOString() : null,
      rejectedAt: offer.rejectedAt ? offer.rejectedAt.toISOString() : null,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };

    return { success: true, message: "Offer letter verified successfully", data: serialized };
  } catch (error: any) {
    console.error("Verify offer letter action failed:", error);
    return { success: false, message: error.message || "Failed to verify offer letter", data: null };
  }
}

/**
 * Resends an existing offer letter via email to the candidate.
 */
export async function resendOfferLetterEmailAction(offerId: string, recipientEmail?: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !["admin", "super-admin", "employee"].includes(meRes.data.role)) {
      return { success: false, message: "Unauthorized access" };
    }

    const offer = await OfferLetter.findById(offerId);
    if (!offer) {
      return { success: false, message: "Offer letter not found" };
    }

    const targetEmail = (recipientEmail || offer.email).trim();

    let pdfBuffer = offer.pdfBuffer;
    if (!pdfBuffer) {
      // Regenerate PDF if it's missing in database for some reason
      console.log("PDF buffer missing, regenerating in-memory...");
      let jobData: any = null;
      if (offer.applicationId) {
        const app = await Application.findById(offer.applicationId);
        if (app && app.jobId) {
          jobData = await Job.findById(app.jobId);
        }
      }

      const job = jobData || {
        title: offer.position,
        type: offer.workType,
        location: offer.joiningLocation,
        salary: offer.salary,
        department: offer.department,
        offerType: offer.offerType,
        startDate: offer.startDate,
        validUntil: offer.validUntil,
        joiningLocation: offer.joiningLocation,
        workType: offer.workType,
        benefits: offer.benefits,
        reportingManager: offer.reportingManager,
        hrContact: {
          name: offer.hrContactName,
          email: offer.hrContactEmail,
          phone: offer.hrContactPhone
        },
        duration: offer.duration,
        additionalNotes: offer.additionalNotes
      };

      pdfBuffer = await PDFService.generateOfferLetter(
        {
          fullName: offer.candidateName,
          email: targetEmail,
          phone: "N/A",
          moreInfo: {}
        },
        job
      );

      offer.pdfBuffer = pdfBuffer;
      offer.pdfGeneratedAt = new Date();
      await offer.save();
    }

    // Send SMTP email with PDF attachment
    const acceptanceLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contract/${offer._id}`;
    await EmailService.sendOfferLetter(
      { fullName: offer.candidateName, email: targetEmail, name: offer.candidateName },
      { title: offer.position },
      pdfBuffer,
      acceptanceLink,
      offer.validUntil,
      {
        name: offer.hrContactName,
        email: offer.hrContactEmail,
        phone: offer.hrContactPhone
      }
    );

    // Log audit action
    await AuditLog.create({
      actor: meRes.data.id,
      actorRole: meRes.data.role,
      action: "EMAIL",
      resourceEntity: "OfferLetter",
      resourceId: offer._id,
      changes: { emailResentTo: targetEmail }
    });

    return { success: true, message: `Offer letter successfully resent to ${targetEmail}!` };
  } catch (error: any) {
    console.error("Resend offer letter email failed:", error);
    return { success: false, message: error.message || "Failed to resend email" };
  }
}

/**
 * Extends the validity period of an offer letter and regenerates its PDF buffer.
 */
export async function extendOfferValidityAction(offerId: string, newValidUntilDate: string, comments?: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !["admin", "super-admin", "employee"].includes(meRes.data.role)) {
      return { success: false, message: "Unauthorized access" };
    }

    const offer = await OfferLetter.findById(offerId);
    if (!offer) {
      return { success: false, message: "Offer letter not found" };
    }

    const oldDate = offer.validUntil;
    const newDate = new Date(newValidUntilDate);
    
    // Update validity
    offer.validUntil = newDate;
    if (comments) {
      offer.additionalNotes = offer.additionalNotes 
        ? `${offer.additionalNotes}\n\n[Extension note: ${comments}]` 
        : `[Extension note: ${comments}]`;
    }

    // Regenerate dynamic PDF buffer with updated date
    let jobData: any = null;
    if (offer.applicationId) {
      const app = await Application.findById(offer.applicationId);
      if (app && app.jobId) {
        jobData = await Job.findById(app.jobId);
      }
    }

    const job = jobData || {
      title: offer.position,
      type: offer.workType,
      location: offer.joiningLocation,
      salary: offer.salary,
      department: offer.department,
      offerType: offer.offerType,
      startDate: offer.startDate,
      validUntil: newDate,
      joiningLocation: offer.joiningLocation,
      workType: offer.workType,
      benefits: offer.benefits,
      reportingManager: offer.reportingManager,
      hrContact: {
        name: offer.hrContactName,
        email: offer.hrContactEmail,
        phone: offer.hrContactPhone
      },
      duration: offer.duration,
      additionalNotes: offer.additionalNotes
    };

    const pdfBuffer = await PDFService.generateOfferLetter(
      {
        fullName: offer.candidateName,
        email: offer.email,
        phone: "N/A",
        moreInfo: {}
      },
      {
        ...job,
        validUntil: newDate // Ensure the new validity date is drawn on the PDF
      }
    );

    offer.pdfBuffer = pdfBuffer;
    offer.pdfGeneratedAt = new Date();
    await offer.save();

    // Log audit
    await AuditLog.create({
      actor: meRes.data.id,
      actorRole: meRes.data.role,
      action: "UPDATE",
      resourceEntity: "OfferLetter",
      resourceId: offer._id,
      changes: {
        from: { validUntil: oldDate.toISOString() },
        to: { validUntil: newDate.toISOString() },
        comments
      }
    });

    return { success: true, message: "Offer letter validity extended and PDF regenerated successfully!" };
  } catch (error: any) {
    console.error("Extend offer validity failed:", error);
    return { success: false, message: error.message || "Failed to extend validity period" };
  }
}

/**
 * Bulk generates and issues offer letters from parsed CSV rows.
 */
export async function bulkIssueOfferLettersAction(
  commonDetails: {
    joiningLocation: string;
    workType: string;
    validUntil: string;
    hrContactName: string;
    hrContactEmail: string;
    hrContactPhone: string;
    additionalNotes?: string;
    offerType?: string;
    payoutFrequency?: string;
    sendEmail?: boolean;
    endDate?: string;
    duration?: string;
  },
  rows: Array<{
    candidateName: string;
    email: string;
    position: string;
    department: string;
    salary: string | number;
    startDate: string;
    endDate?: string;
    duration?: string;
    joiningLocation?: string;
    workType?: string;
    validUntil?: string;
    hrContactName?: string;
    hrContactEmail?: string;
    hrContactPhone?: string;
    additionalNotes?: string;
    offerType?: string;
    payoutFrequency?: string;
  }>
): Promise<{
  success: boolean;
  message: string;
  successCount: number;
  errorCount: number;
  errors?: Array<{ row: any; error: string }>;
}> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !["admin", "super-admin", "employee"].includes(meRes.data.role)) {
      return { success: false, message: "Unauthorized access", successCount: 0, errorCount: 0 };
    }

    const actor = meRes.data;
    const crypto = require("crypto");

    const {
      joiningLocation,
      workType,
      validUntil,
      hrContactName,
      hrContactEmail,
      hrContactPhone,
      additionalNotes = "",
      offerType = "Job",
      payoutFrequency = "",
      sendEmail = false,
      endDate: commonEndDate,
      duration: commonDuration
    } = commonDetails;

    if (!joiningLocation || !validUntil) {
      return { success: false, message: "Common fields (Joining Location, Valid Until) are required", successCount: 0, errorCount: 0 };
    }

    const parsedValidUntil = new Date(validUntil);
    const errors: Array<{ row: any; error: string }> = [];
    let successCount = 0;

    for (const row of rows) {
      try {
        const { candidateName, email, position, department, salary, startDate } = row;

        if (!candidateName || !email || !position || !department || !salary || !startDate) {
          const missing = [
            !candidateName && "candidateName",
            !email && "email",
            !position && "position",
            !department && "department",
            !salary && "salary",
            !startDate && "startDate"
          ].filter(Boolean).join(", ");
          
          errors.push({
            row,
            error: `Missing required fields: ${missing}`
          });
          continue;
        }

        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          errors.push({ row, error: `Invalid startDate format: ${startDate}` });
          continue;
        }

        const resolvedJoiningLocation = row.joiningLocation || joiningLocation;
        const resolvedWorkType = (row.workType || workType || "On-site") as "On-site" | "Remote" | "Hybrid";
        const resolvedValidUntil = row.validUntil ? new Date(row.validUntil) : parsedValidUntil;
        const resolvedHrContactName = row.hrContactName || hrContactName;
        const resolvedHrContactEmail = row.hrContactEmail || hrContactEmail;
        const resolvedHrContactPhone = row.hrContactPhone || hrContactPhone;
        const resolvedAdditionalNotes = row.additionalNotes || additionalNotes || "";
        const resolvedOfferType = (row.offerType || offerType || "Job") as "Job" | "Internship";
        const resolvedPayoutFrequency = row.payoutFrequency || payoutFrequency || "";

        const resolvedEndDate = row.endDate ? new Date(row.endDate) : (commonEndDate ? new Date(commonEndDate) : undefined);
        
        let resolvedDuration = row.duration || commonDuration || "";
        if (!resolvedDuration && resolvedEndDate) {
          const diffMs = resolvedEndDate.getTime() - parsedStartDate.getTime();
          const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const months = Math.floor(totalDays / 30.44);
          const days = Math.round(totalDays % 30.44);
          if (months > 0 && days >= 5) {
            resolvedDuration = `${months} month${months > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
          } else if (months > 0) {
            resolvedDuration = `${months} month${months > 1 ? 's' : ''}`;
          } else {
            resolvedDuration = `${totalDays} day${totalDays > 1 ? 's' : ''}`;
          }
        }
        if (!resolvedDuration) {
          resolvedDuration = "Until project completion or 3 months (whichever is longer)";
        }

        const shortId = new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase();

        const offerLetter = new OfferLetter({
          userId: new mongoose.Types.ObjectId(actor.id),
          candidateName,
          email,
          position,
          department,
          salary: String(salary),
          startDate: parsedStartDate,
          endDate: resolvedEndDate,
          duration: resolvedDuration,
          joiningLocation: resolvedJoiningLocation,
          workType: resolvedWorkType,
          hrContactName: resolvedHrContactName,
          hrContactEmail: resolvedHrContactEmail,
          hrContactPhone: resolvedHrContactPhone,
          validUntil: resolvedValidUntil,
          additionalNotes: resolvedAdditionalNotes,
          offerType: resolvedOfferType,
          payoutFrequency: resolvedPayoutFrequency,
          shortId,
          acceptanceToken: crypto.randomBytes(32).toString("hex"),
          status: "Pending"
        });

        // Generate and save PDF buffer
        let pdfBuffer: Buffer;
        try {
          pdfBuffer = await PDFService.generateOfferLetter(
            {
              fullName: candidateName,
              email,
              phone: "N/A",
              moreInfo: {}
            },
            {
              title: position,
              department,
              salary,
              offerType: resolvedOfferType,
              startDate: parsedStartDate,
              validUntil: resolvedValidUntil,
              joiningLocation: resolvedJoiningLocation,
              workType: resolvedWorkType,
              benefits: [],
              reportingManager: "HR Operations Team",
              hrContact: {
                name: resolvedHrContactName,
                email: resolvedHrContactEmail,
                phone: resolvedHrContactPhone
              },
              duration: resolvedDuration,
              additionalNotes: resolvedAdditionalNotes
            }
          );
          
          offerLetter.pdfBuffer = pdfBuffer;
          offerLetter.pdfGeneratedAt = new Date();
        } catch (pdfErr) {
          console.error("PDF generation failed in bulk row:", pdfErr);
        }

        await offerLetter.save();
        successCount++;

        // Trigger email if requested
        if (sendEmail) {
          try {
            const acceptanceLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contract/${offerLetter._id}`;
            await EmailService.sendOfferLetter(
              { fullName: candidateName, email, name: candidateName },
              { title: position },
              offerLetter.pdfBuffer || Buffer.from("PDF Error"),
              acceptanceLink,
              resolvedValidUntil,
              {
                name: resolvedHrContactName,
                email: resolvedHrContactEmail,
                phone: resolvedHrContactPhone
              }
            );
          } catch (emailErr) {
            console.error("Bulk resend email row failed:", emailErr);
          }
        }

        // Log audit
        try {
          await AuditLog.create({
            actor: actor.id,
            actorRole: actor.role,
            action: "ISSUE",
            resourceEntity: "OfferLetter",
            resourceId: offerLetter._id,
            changes: { new: { candidateName, position, type: "BULK" } }
          });
        } catch (auditErr) {}

      } catch (err: any) {
        console.error("Row processing error in bulk action:", err);
        errors.push({ row, error: err.message || "Unknown error" });
      }
    }

    return {
      success: true,
      message: `Bulk issuance complete. ${successCount} succeeded, ${errors.length} failed.`,
      successCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error: any) {
    console.error("Bulk Offer Letter Action Error:", error);
    return { success: false, message: error.message || "Failed to process bulk offer letters", successCount: 0, errorCount: 0 };
  }
}

