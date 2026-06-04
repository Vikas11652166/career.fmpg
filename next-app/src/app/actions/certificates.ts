"use server";

import connectDB from "@/lib/mongodb";
import Certificate from "@/models/certificate";
import User from "@/models/user";
import AuditLog from "@/models/auditLog";
import EmailService from "@/services/emailService";
import PDFService from "@/services/pdfService";
import mongoose from "mongoose";
import { getMeAction } from "./auth";

/**
 * Helper to ensure user is an administrator or employee
 */
async function ensureAdminOrEmployee() {
  const meRes = await getMeAction();
  if (!meRes.success) {
    throw new Error("Unauthenticated. Please log in first.");
  }
  const role = meRes.data.role;
  if (!["admin", "super-admin", "employee"].includes(role)) {
    throw new Error("Unauthorized access. Admin privileges required.");
  }
  return meRes.data;
}

function normalizeCertificateLookupId(rawId = "") {
  return String(rawId).trim().replace(/^FMPG[-\s]*/i, "");
}

/**
 * Issues a new completion certificate and returns details.
 */
export async function issueCertificateAction(certData: {
  name: string;
  email?: string;
  domain: string;
  jobrole: string;
  fromDate: string;
  toDate: string;
  issuedBy?: string;
}) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const { name, email, domain, jobrole, fromDate, toDate, issuedBy } = certData;

    if (!name || !domain || !jobrole || !fromDate || !toDate) {
      return { success: false, message: "Missing required fields" };
    }

    const certificate = (await Certificate.create({
      userId: new mongoose.Types.ObjectId(actor.id),
      name,
      recipientEmail: email || undefined,
      domain,
      jobrole,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      issuedBy: issuedBy || "FMPG",
      issuedOn: new Date(),
    })) as any;

    // Generate Audit Log
    try {
      await AuditLog.create({
        actor: actor.id,
        actorRole: actor.role,
        action: "ISSUE",
        resourceEntity: "Certificate",
        resourceId: certificate._id,
        changes: { name, domain, jobrole }
      });
    } catch (auditErr) {}

    // Auto-send email if email is provided
    if (email) {
      try {
        const pdfBuffer = await PDFService.generateCertificatePDFBuffer(certificate);
        const htmlContent = `
          <h2>Congratulations, ${name}!</h2>
          <p>We are pleased to present you with your official <strong>Certificate of Completion</strong> for your internship as a <strong>${jobrole}</strong> in the <strong>${domain}</strong> department.</p>
          <p>Your hard work, commitment, and dedication have been highly valued by the entire FMPG family. We wish you the absolute best in your future endeavors!</p>
          <p>Your signed and verified certificate is attached as a PDF. You can also verify its validity online at fmpg.in.</p>
          <p>Best Regards,<br><strong>Operations & HR Team @ FMPG</strong></p>
        `;

        await EmailService.sendEmail({
          to: email,
          subject: `Certificate of Completion: ${jobrole} - FMPG`,
          html: htmlContent,
          attachments: [
            {
              filename: `certificate-${certificate._id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf"
            }
          ]
        });
      } catch (emailErr) {
        console.error("Auto email sending failed:", emailErr);
      }
    }

    return {
      success: true,
      message: "Certificate issued successfully",
      certificateId: `FMPG-${certificate._id.toString()}`,
    };
  } catch (error: any) {
    console.error("Issue certificate failed:", error);
    return { success: false, message: error.message || "Failed to issue certificate" };
  }
}

/**
 * Gets all certificates in the system (Admin only).
 */
export async function getAllCertificatesAction() {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const certs = await Certificate.find()
      .populate("userId", "name email")
      .sort({ issuedOn: -1 })
      .lean();

    const serialized = certs.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
      userId: c.userId ? {
        _id: c.userId._id.toString(),
        name: c.userId.name,
        email: c.userId.email
      } : null,
      fromDate: c.fromDate.toISOString(),
      toDate: c.toDate.toISOString(),
      issuedOn: c.issuedOn.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get all certificates failed:", error);
    return { success: false, message: error.message || "Failed to load certificates", data: [] };
  }
}

/**
 * Verifies a certificate publically by ID.
 */
export async function verifyCertificateAction(rawId: string) {
  try {
    await connectDB();
    const certId = normalizeCertificateLookupId(rawId);
    let certificate: any = null;

    if (mongoose.Types.ObjectId.isValid(certId)) {
      certificate = await Certificate.findById(certId).populate("userId", "name email").lean();
    } else if (certId.length >= 4) {
      certificate = await Certificate.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: certId + "$",
            options: "i"
          }
        }
      }).populate("userId", "name email").lean();
    }

    if (!certificate) {
      return { success: false, message: "Certificate not found or ID is invalid.", data: null };
    }

    const serialized = {
      ...certificate,
      _id: certificate._id.toString(),
      userId: certificate.userId ? {
        _id: certificate.userId._id.toString(),
        name: certificate.userId.name,
        email: certificate.userId.email
      } : null,
      fromDate: certificate.fromDate.toISOString(),
      toDate: certificate.toDate.toISOString(),
      issuedOn: certificate.issuedOn.toISOString(),
    };

    return { success: true, message: "Certificate verified successfully", data: serialized };
  } catch (error: any) {
    console.error("Verify certificate action failed:", error);
    return { success: false, message: error.message || "Failed to verify certificate", data: null };
  }
}

/**
 * Re-sends certificate PDF to recipient email manually (Admin only).
 */
export async function sendCertificateEmailAction(
  id: string,
  recipientEmail: string,
  subject?: string,
  message?: string
) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const certId = normalizeCertificateLookupId(id);
    let certificate = await Certificate.findById(certId);

    if (!certificate) {
      return { success: false, message: "Certificate not found" };
    }

    const emailToSend = recipientEmail || certificate.recipientEmail;
    if (!emailToSend) {
      return { success: false, message: "Recipient email is required" };
    }

    // Save email if updated
    if (recipientEmail && recipientEmail !== certificate.recipientEmail) {
      certificate.recipientEmail = recipientEmail;
      await certificate.save();
    }

    // Generate PDF and send email
    const pdfBuffer = await PDFService.generateCertificatePDFBuffer(certificate);
    const htmlContent = `
      <h2>Internship Completion Update</h2>
      <p>Hello ${certificate.name},</p>
      <p>${message || `We are pleased to send you your verified Certificate of Completion for your internship at FMPG.`}</p>
      <p>Your signed and verified certificate is attached as a PDF. You can also verify its validity online at fmpg.in.</p>
      <p>Best Regards,<br><strong>HR Operations Team @ FMPG</strong></p>
    `;

    await EmailService.sendEmail({
      to: emailToSend,
      subject: subject || `Certificate of Completion: ${certificate.jobrole} - FMPG`,
      html: htmlContent,
      attachments: [
        {
          filename: `certificate-${certificate._id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    // Log the audit email action
    try {
      await AuditLog.create({
        actor: actor.id,
        actorRole: actor.role,
        action: "EMAIL",
        resourceEntity: "Certificate",
        resourceId: certificate._id,
        changes: { recipientEmail: emailToSend }
      });
    } catch (auditErr) {}

    return { success: true, message: `Certificate successfully emailed to ${emailToSend}` };
  } catch (error: any) {
    console.error("Send certificate email failed:", error);
    return { success: false, message: error.message || "Failed to send email" };
  }
}

/**
 * Downloads a certificate as base64 string for direct client conversion (Admin & Candidate).
 */
export async function downloadCertificateBase64Action(id: string) {
  try {
    await connectDB();
    const certId = normalizeCertificateLookupId(id);
    const certificate = await Certificate.findById(certId);

    if (!certificate) {
      return { success: false, message: "Certificate not found", data: null };
    }

    const pdfBuffer = await PDFService.generateCertificatePDFBuffer(certificate);
    const base64 = pdfBuffer.toString("base64");

    return { success: true, data: base64 };
  } catch (error: any) {
    console.error("Download certificate failed:", error);
    return { success: false, message: error.message || "Failed to download certificate", data: null };
  }
}
