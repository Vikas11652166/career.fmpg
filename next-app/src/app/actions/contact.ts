"use server";

import connectDB from "@/lib/mongodb";
import EmailService from "@/services/emailService";
import AuditLog from "@/models/auditLog";

/**
 * Handles Contact Us form submissions and sends notification emails.
 */
export async function submitContactInquiryAction(formData: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}) {
  try {
    await connectDB();
    const { name, email, phone, company, message } = formData;

    if (!name || !email || !message) {
      return { success: false, message: "Name, email, and message are required." };
    }

    // Email content for support staff
    const supportEmailHtml = `
      <h2>New Contact Inquiry Received</h2>
      <p>A user has submitted a message via the FMPG Careers Portal contact form:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        ${phone ? `<p style="margin: 4px 0;"><strong>Phone/Skype:</strong> ${phone}</p>` : ""}
        ${company ? `<p style="margin: 4px 0;"><strong>Company:</strong> ${company}</p>` : ""}
        <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #d1d5db; white-space: pre-wrap;"><strong>Message:</strong><br>${message}</p>
      </div>
      
      <p>Please respond to this inquiry as soon as possible by replying directly to this email.</p>
      <p>Best Regards,<br><strong>FMPG Automated Registry Desk</strong></p>
    `;

    // Send the email to the system administrator/support
    const adminEmail = process.env.EMAIL_USER || "contact@fmpg.in";
    await EmailService.sendEmail({
      to: adminEmail,
      subject: `[Contact Form] New Inquiry from ${name} - FMPG`,
      html: supportEmailHtml
    });

    // Send a polite acknowledgment email back to the sender
    try {
      const ackHtml = `
        <h2>Inquiry Received</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to us. We have successfully received your inquiry!</p>
        <p>Our team is currently reviewing your message and will get back to you within 24-48 business hours.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #059669; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563;"><em>"We appreciate your patience while we review your request."</em></p>
        </div>
        
        <p>Warm Regards,<br><strong>FMPG Help Desk & Operations</strong></p>
      `;

      await EmailService.sendEmail({
        to: email,
        subject: `We've received your message! - FMPG`,
        html: ackHtml
      });
    } catch (ackErr) {
      console.error("Failed to send contact acknowledgment email:", ackErr);
    }

    return { success: true, message: "Your message has been sent successfully. We'll get back to you soon!" };
  } catch (error: any) {
    console.error("Contact form action failed:", error);
    return { success: false, message: error.message || "Failed to submit message. Please try again." };
  }
}
