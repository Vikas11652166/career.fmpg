"use server";

import connectDB from "@/lib/mongodb";
import Application from "@/models/application";
import Job from "@/models/job";
import AuditLog from "@/models/auditLog";
import Notification from "@/models/notification";
import resumeParserService from "@/services/resumeParserService";
import EmailService from "@/services/emailService";
import mongoose from "mongoose";
import { getMeAction } from "./auth";
import { serializeDoc } from "@/lib/utils";

import https from "https";
import http from "http";

/**
 * Downloads a file directly via low-level Node.js https/http protocols,
 * bypassing Next.js global fetch interceptors and headers locks.
 */
async function downloadFile(url: string): Promise<Buffer> {
  try {
    // Attempt standard fetch first as it handles redirects, caching, and SSL certificates much more robustly
    const response = await fetch(url);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    console.warn(`Standard fetch in downloadFile returned status ${response.status} ${response.statusText}, falling back to low-level Node.js protocol...`);
  } catch (fetchErr: any) {
    console.warn(`Standard fetch failed in downloadFile: ${fetchErr.message || fetchErr}, falling back to low-level Node.js protocol...`);
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download file: status code ${res.statusCode} ${res.statusMessage}`));
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", (err) => reject(err));
    }).on("error", (err) => reject(err));
  });
}

/**
 * Downloads a resume from Cloudinary and parses it server-side.
 */
export async function parseUploadedResumeAction(url: string, fileName: string) {
  try {
    console.log(`Fetching resume from URL: ${url}`);
    let buffer: Buffer;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      buffer = await downloadFile(url);
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download resume from storage: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Determine mimeType
    const fileExtension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    const mimeType = ['.doc', '.docx'].includes(fileExtension)
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    const result = await resumeParserService.parseResume(buffer, mimeType, fileName);
    return result;
  } catch (error: any) {
    console.error("Resume parsing action failed:", error);
    return { success: false, error: error.message || "Failed to parse resume", data: null };
  }
}

/**
 * Submits a new job application, sends confirmations, and alerts admins.
 */
export async function submitApplicationAction(formData: any): Promise<{ success: boolean; message: string; applicationId?: string }> {
  try {
    await connectDB();
    const { 
      jobId, 
      fullName, 
      email, 
      phone, 
      resumeUrl, 
      cloudinaryPublicId, 
      experience, 
      education, 
      skills, 
      coverLetter, 
      questionAnswers,
      recaptchaToken
    } = formData;

    if (!jobId || !fullName || !email || !phone) {
      return { success: false, message: "Missing required profile details" };
    }

    // Verify reCAPTCHA token
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
    if (recaptchaToken) {
      try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
        const verifyRes = await fetch(verifyUrl, { method: "POST" });
        const verifyJson = await verifyRes.json();
        
        if (!verifyJson.success) {
          console.warn("reCAPTCHA validation failed:", verifyJson["error-codes"]);
          return { success: false, message: "reCAPTCHA verification failed. Please try again." };
        }
        console.log("reCAPTCHA verified successfully!");
      } catch (verifyErr) {
        console.error("reCAPTCHA validation request failed:", verifyErr);
      }
    } else {
      if (process.env.RECAPTCHA_SECRET_KEY) {
        return { success: false, message: "Please complete the reCAPTCHA challenge before submitting." };
      }
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return { success: false, message: "Specified job opening not found" };
    }

    // Get current authenticated user if logged in
    const meRes = await getMeAction();
    const userId = meRes.success ? meRes.data.id : undefined;

    // Check if already applied
    const query: any = { jobId, email };
    if (userId) query.userId = userId;
    
    const alreadyApplied = await Application.findOne(query);
    if (alreadyApplied) {
      return { success: false, message: "You have already submitted an application for this role" };
    }

    const newApp = await Application.create({
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      fullName,
      email,
      phone,
      resumeUrl,
      cloudinaryPublicId,
      experience,
      education,
      skills: Array.isArray(skills) ? skills : [],
      coverLetter,
      questionAnswers: Array.isArray(questionAnswers) ? questionAnswers : [],
      status: "pending"
    });

    // Send application email confirmation to candidate
    try {
      await EmailService.sendApplicationConfirmation({ email, fullName }, job.title);
    } catch (emailError) {
      console.error("Failed to send application confirmation email:", emailError);
    }

    // Log the submission audit trail
    try {
      await AuditLog.create({
        actor: userId || newApp._id, // fallback to application ID if unauthenticated
        actorRole: userId ? meRes.data.role : "user",
        action: "CREATE",
        resourceEntity: "Application",
        resourceId: newApp._id,
        changes: { jobId, fullName, email, status: "pending" }
      });
    } catch (auditError) {
      console.error("Audit log creation failed:", auditError);
    }

    // Create system notification for all active HR / admins
    try {
      const HRUsers = await mongoose.model("User").find({ 
        role: { $in: ["admin", "super-admin", "employee"] } 
      }).select("_id");

      const notificationPromises = HRUsers.map((hr) => {
        return Notification.create({
          userId: hr._id,
          type: "application_status",
          title: "New Application Received",
          message: `${fullName} has applied for the "${job.title}" position.`,
          relatedJobId: job._id,
          relatedApplicationId: newApp._id,
          priority: "medium"
        });
      });

      await Promise.all(notificationPromises);
    } catch (notifErr) {
      console.error("HR notification creation failed:", notifErr);
    }

    return {
      success: true,
      message: "Application submitted successfully! Check your inbox for confirmation.",
      applicationId: newApp._id.toString()
    };
  } catch (error: any) {
    console.error("Submit application action error:", error);
    return { success: false, message: error.message || "Failed to submit application" };
  }
}

/**
 * Retrieves applications submitted by the current authenticated candidate.
 */
export async function getCandidateApplicationsAction(): Promise<{ success: boolean; data: any[] }> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) {
      return { success: false, data: [] };
    }

    const applications = await Application.find({ userId: meRes.data.id })
      .populate({
        path: "jobId",
        select: "title company location type salary department description",
      })
      .populate("offerLetterId")
      .sort({ createdAt: -1 })
      .lean();

    const serialized = serializeDoc(applications);

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Failed to fetch candidate applications:", error);
    return { success: false, data: [] };
  }
}

/**
 * Updates application status (HR action).
 */
export async function updateApplicationStatusAction(
  appId: string, 
  status: "pending" | "reviewing" | "shortlisted" | "rejected" | "offered" | "hired", 
  comments?: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !["admin", "super-admin", "employee"].includes(meRes.data.role)) {
      return { success: false, message: "Unauthorized action" };
    }

    const application = await Application.findById(appId).populate("jobId");
    if (!application) {
      return { success: false, message: "Application record not found" };
    }

    const oldStatus = application.status;
    application.status = status;
    application.updatedAt = new Date();
    await application.save();

    // Trigger rejection email if rejected
    if (status === "rejected") {
      try {
        await EmailService.sendRejectionEmail(
          { email: application.email, fullName: application.fullName },
          (application.jobId as any).title,
          comments
        );
      } catch (emailErr) {}
    }

    // Log the audit status change
    try {
      await AuditLog.create({
        actor: meRes.data.id,
        actorRole: meRes.data.role,
        action: "STATUS_CHANGE",
        resourceEntity: "Application",
        resourceId: application._id,
        changes: { oldStatus, newStatus: status, comments }
      });
    } catch (auditErr) {}

    // Send notifications to the applicant
    try {
      if (application.userId) {
        await Notification.create({
          userId: application.userId,
          type: "application_status",
          title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your application status for "${(application.jobId as any).title}" has been updated to "${status}".`,
          relatedJobId: (application.jobId as any)._id,
          relatedApplicationId: application._id,
          priority: "high"
        });
      }
    } catch (notifErr) {}

    return { success: true, message: `Application status updated to ${status} successfully` };
  } catch (error: any) {
    console.error("Update application status failed:", error);
    return { success: false, message: error.message || "Failed to update application status" };
  }
}
