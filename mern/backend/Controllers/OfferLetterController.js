const { logAudit } = require('../services/auditService');
const { getOfferLetterTemplate, getExtendedOfferTemplate } = require("../utils/emailTemplates");
const OfferLetter = require("../models/offerLetter");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { formatCurrencyValue } = require("../utils/currencyFormatter");
const csv = require('csv-parser');
const { Readable } = require('stream');
const mongoose = require('mongoose');

function normalizeOfferLetterLookupId(rawId = "") {
    // Cleans prefixes like FMPG- or FMPG-OFF-
    return String(rawId).trim().replace(/^(FMPG-OFF-|FMPG-)/i, "");
}

// Email setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.issueOfferLetter = async (req, res) => {
    console.log("OfferLetter: new");
    try {
        const {
            candidateName,
            email,
            position,
            department,
            salary,
            startDate,
            endDate,
            duration,
            joiningLocation,
            workType,
            benefits,
            reportingManager,
            hrContactName,
            hrContactEmail,
            hrContactPhone,
            validUntil,
            additionalNotes,
            offerType,
            payoutFrequency
        } = req.body;

        console.log(`For: ${candidateName}`);

        if (!candidateName || !email || !position || !department || !salary || !startDate || !joiningLocation || !validUntil) {
            console.log("Missing required fields");
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        const userId = req.user.userId;
        console.log(`Issuer: ${userId}`);

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = endDate ? new Date(endDate) : null;
        const parsedValidUntil = new Date(validUntil);
        
        const resolvedDuration = (typeof duration === 'string' && duration.trim())
            ? duration.trim()
            : (calculateDurationText(parsedStartDate, parsedEndDate) || 'Until project completion or 3 months (whichever is longer)');

        console.log("Creating offer letter");
        const offerLetter = new OfferLetter({
            userId,
            candidateName,
            email,
            position,
            department,
            salary,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            duration: resolvedDuration,
            joiningLocation,
            workType: workType || 'On-site',
            benefits: benefits || [],
            reportingManager,
            hrContactName,
            hrContactEmail,
            hrContactPhone,
            validUntil: parsedValidUntil,
            additionalNotes,
            offerType: offerType || 'Job',
            payoutFrequency: payoutFrequency || ''
        });

        const savedOfferLetter = await offerLetter.save();
        console.log(`Saved: ${savedOfferLetter._id}`);

        try {
            await logAudit({
                req,
                action: "ISSUE",
                resourceEntity: "OfferLetter",
                resourceId: savedOfferLetter._id,
                changes: { new: { candidateName, position, status: 'Draft' } }
            });
        } catch (e) { }

        res.status(201).json({
            message: "Offer letter issued successfully",
            offerLetterId: savedOfferLetter._id,
            offerLetterUrl: `/offer-letters/${savedOfferLetter._id}.pdf`
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllOfferLetters = async (req, res) => {
    console.log("OfferLetters: all");
    try {
        const offerLetters = await OfferLetter.find().populate("userId", "name email").sort({ createdAt: -1 }).lean();
        console.log(`Found: ${offerLetters.length}`);
        res.status(200).json(offerLetters);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getOfferLetterById = async (req, res) => {
    console.log(`Get offer letter: ${req.params.id}`);
    try {
        const offerLetterId = normalizeOfferLetterLookupId(req.params.id);
        if (!mongoose.Types.ObjectId.isValid(offerLetterId)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        console.log(`Finding: ${offerLetterId}`);
        const offerLetter = await OfferLetter.findById(offerLetterId).populate("userId", "name email");

        if (!offerLetter) {
            console.log(`Not found: ${offerLetterId}`);
            return res.status(404).json({ message: "Offer letter not found" });
        }

        console.log(`Found: ${offerLetter.candidateName}`);
        res.status(200).json(offerLetter);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.verifyOfferLetter = async (req, res) => {
    console.log(`Verify Offer: ${req.params.id}`);
    try {
        const offerLetterId = normalizeOfferLetterLookupId(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(offerLetterId)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        console.log(`Finding: ${offerLetterId}`);
        const offerLetter = await OfferLetter.findById(offerLetterId).populate("userId", "name email");

        if (!offerLetter) {
            console.log(`Not found: ${offerLetterId}`);
            return res.status(404).json({ message: "Offer letter not found" });
        }

        console.log(`Verified Offer: ${offerLetter.candidateName}`);
        res.status(200).json({
            message: "Offer letter verified successfully",
            offerLetter
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateOfferLetterStatus = async (req, res) => {
    console.log(`Update offer letter status: ${req.params.id}`);
    try {
        const { status } = req.body;
        const offerLetterId = normalizeOfferLetterLookupId(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(offerLetterId)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updateData = { status };
        if (status === 'Accepted') {
            updateData.acceptedAt = new Date();
            updateData.rejectedAt = undefined;
        }
        if (status === 'Rejected') {
            updateData.rejectedAt = new Date();
            updateData.acceptedAt = undefined;
        }
        if (status === 'Pending') {
            updateData.acceptedAt = undefined;
            updateData.rejectedAt = undefined;
        }

        const oldLetter = await OfferLetter.findById(offerLetterId);
        const offerLetter = await OfferLetter.findByIdAndUpdate(
            offerLetterId,
            updateData,
            { new: true }
        );

        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        try {
            if (oldLetter) {
                await logAudit({
                    req,
                    action: "STATUS_CHANGE",
                    resourceEntity: "OfferLetter",
                    resourceId: offerLetter._id,
                    changes: { oldStatus: oldLetter.status, newStatus: offerLetter.status }
                });
            }
        } catch (e) { }

        const linkedUser = await User.findOne({ email: offerLetter.email });
        if (linkedUser) {
            const userUpdate = { offerLetter: offerLetter._id };
            if (status === 'Accepted') {
                userUpdate.status = 'active';
            } else if (status === 'Rejected' && linkedUser.status === 'active') {
                userUpdate.status = 'active'; // Still active as a candidate/user
            }

            await User.findByIdAndUpdate(linkedUser._id, userUpdate, { runValidators: true });
        }

        res.status(200).json({
            message: "Offer letter status updated successfully",
            offerLetter
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.extendOfferLetter = async (req, res) => {
    console.log(`Extend offer letter: ${req.params.id}`);
    try {
        const { newValidUntil, newStartDate, newEndDate, additionalNotes } = req.body;
        const offerLetterId = normalizeOfferLetterLookupId(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(offerLetterId)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        if (!newValidUntil) {
            return res.status(400).json({ message: "New valid until date is required" });
        }

        // Find the offer letter
        const offerLetter = await OfferLetter.findById(offerLetterId);

        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        // Check if offer letter is accepted
        if (offerLetter.status !== 'Accepted') {
            return res.status(400).json({ message: "Only accepted offer letters can be extended" });
        }

        // Validate new dates
        const newValidDate = new Date(newValidUntil);
        const currentValidDate = new Date(offerLetter.validUntil);

        if (newValidDate <= currentValidDate) {
            return res.status(400).json({ message: "New valid until date must be after the current valid until date" });
        }

        // If new start date is provided, validate it
        if (newStartDate) {
            const newStartDateObj = new Date(newStartDate);
            if (newStartDateObj >= newValidDate) {
                return res.status(400).json({ message: "New start date must be before the new valid until date" });
            }
        }

        // Build extension history entry
        const extensionHistoryEntry = {
            oldValidUntil: offerLetter.validUntil,
            newValidUntil: newValidDate,
            oldStartDate: offerLetter.startDate,
            newStartDate: newStartDate ? new Date(newStartDate) : offerLetter.startDate,
            notes: additionalNotes || null,
            previousOfferSnapshot: {
                position: offerLetter.position,
                department: offerLetter.department,
                salary: offerLetter.salary,
                joiningLocation: offerLetter.joiningLocation,
                workType: offerLetter.workType,
                reportingManager: offerLetter.reportingManager,
                validUntil: offerLetter.validUntil,
                startDate: offerLetter.startDate
            },
            updatedOfferSnapshot: {
                position: offerLetter.position,
                department: offerLetter.department,
                salary: offerLetter.salary,
                joiningLocation: offerLetter.joiningLocation,
                workType: offerLetter.workType,
                reportingManager: offerLetter.reportingManager,
                validUntil: newValidDate,
                startDate: newStartDate ? new Date(newStartDate) : offerLetter.startDate
            },
            extendedAt: new Date(),
            extendedBy: req.user.userId
        };

        // Update the offer letter
        const updateData = {
            $set: {
                validUntil: newValidDate,
                updatedAt: new Date()
            },
            $push: {
                extensionHistory: extensionHistoryEntry
            }
        };

        if (newStartDate) {
            updateData.$set.startDate = new Date(newStartDate);
        }

        if (newEndDate) {
            updateData.$set.endDate = new Date(newEndDate);
        }

        const effectiveStartDate = newStartDate ? new Date(newStartDate) : offerLetter.startDate;
        const effectiveEndDate = newEndDate ? new Date(newEndDate) : offerLetter.endDate;

        if (newStartDate || newEndDate) {
            updateData.$set.duration = calculateDurationText(effectiveStartDate, effectiveEndDate)
                || offerLetter.duration;
        }

        if (additionalNotes) {
            updateData.$set.additionalNotes = additionalNotes;
        }

        const updatedOfferLetter = await OfferLetter.findByIdAndUpdate(
            offerLetterId,
            updateData,
            { new: true }
        ).populate("userId", "name email");

        console.log(`Offer letter extended successfully for: ${updatedOfferLetter.candidateName}`);

        try {
            await logAudit({
                req,
                action: "UPDATE",
                resourceEntity: "OfferLetter",
                resourceId: updatedOfferLetter._id,
                changes: { extensionHistory: true }
            });
        } catch (e) { }
        
        // Send extension email notification
        try {
            const acceptanceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/offer/accept/job/${updatedOfferLetter._id}`;
            const pdfBuffer = await generateOfferLetterPDFInMemory(updatedOfferLetter);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: updatedOfferLetter.email,
                replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_USER,
                subject: `Offer Validity Extended - ${updatedOfferLetter.position} at FMPG`,
                html: getExtendedOfferTemplate(
                    updatedOfferLetter.candidateName,
                    updatedOfferLetter.position,
                    acceptanceUrl,
                    updatedOfferLetter.validUntil,
                    {
                        name: updatedOfferLetter.hrContactName || 'HR Team',
                        email: updatedOfferLetter.hrContactEmail || 'hr@fmpg.com',
                        phone: updatedOfferLetter.hrContactPhone || '1234567890'
                    }
                ),
                attachments: [
                    {
                        filename: `Offer_Letter_Extended_${updatedOfferLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log(`Extension email sent to: ${updatedOfferLetter.email}`);
        } catch (emailError) {
            console.error("Failed to send extension email:", emailError.message);
        }

        res.status(200).json({
            message: "Offer letter extended successfully",
            offerLetter: updatedOfferLetter
        });
    } catch (error) {
        console.error("Error extending offer letter:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.downloadOfferLetter = async (req, res) => {
    console.log(`Download request for offer letter: ${req.params.id}`);
    try {
        const offerLetterId = normalizeOfferLetterLookupId(req.params.id);
        if (!mongoose.Types.ObjectId.isValid(offerLetterId)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        const offerLetter = await OfferLetter.findById(offerLetterId);

        if (!offerLetter) {
            console.log(`Offer letter not found: ${offerLetterId}`);
            return res.status(404).json({ message: "Offer letter not found" });
        }

        console.log(`Generating PDF in memory for: ${offerLetter.candidateName}`);

        const filename = `offer-letter-${offerLetterId}.pdf`;

        // Generate PDF in memory
        const pdfBuffer = await generateOfferLetterPDFInMemory(offerLetter);

        // Send file directly from memory
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        try {
            // Avoid blocking download if log fails
            await logAudit({
                req,
                action: "DOWNLOAD",
                resourceEntity: "OfferLetter",
                resourceId: offerLetter._id,
                changes: { file: "PDF" }
            });
        } catch (e) { }

        res.end(pdfBuffer);
        console.log(`PDF sent directly from memory: ${filename}`);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.sendOfferLetterEmail = async (req, res) => {
    console.log(`Send offer letter email: ${req.params.id}`);
    try {
        const offerLetterId = normalizeOfferLetterLookupId(req.params.id);
        const { recipientEmail } = req.body;

        if (!mongoose.Types.ObjectId.isValid(offerLetterId)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        const offerLetter = await OfferLetter.findById(offerLetterId);

        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        // Find application to get its slug for the URL
        const Application = require("../models/application");
        const application = await Application.findById(offerLetter.applicationId).populate('jobId');

        const filename = `offer-letter-${offerLetterId}.pdf`;

        // Generate PDF in memory
        const pdfBuffer = await generateOfferLetterPDFInMemory(offerLetter);

        const emailRecipient = recipientEmail || offerLetter.email;
        const jobSlug = application.jobId?.slug || 'job';
        const applicationSlug = application.slug || application._id;
        const acceptanceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/offer/accept/${jobSlug}/${applicationSlug}`;

        // Determine if this is an internship
        const isInternship = (offerLetter.offerType && offerLetter.offerType.toLowerCase() === 'internship') ||
            (offerLetter.position && offerLetter.position.toLowerCase().includes('intern')) ||
            (offerLetter.salary === 0 || offerLetter.salary === "0");

        // Format date
        const formatEmailDate = (date) => {
            return new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const isExtended = offerLetter.extensionHistory && offerLetter.extensionHistory.length > 0;
        const template = isExtended ? getExtendedOfferTemplate : getOfferLetterTemplate;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailRecipient,
            replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_USER,
            subject: isExtended 
                ? `Offer Validity Extended - ${offerLetter.position} at ${offerLetter.companyName || 'FMPG'}`
                : (isInternship
                    ? `Internship Offer - ${offerLetter.position} at ${offerLetter.companyName || 'FMPG'}`
                    : `Job Offer - ${offerLetter.position} at ${offerLetter.companyName || 'FMPG'}`),
            html: template(
                offerLetter.candidateName,
                offerLetter.position,
                acceptanceUrl,
                offerLetter.validUntil,
                {
                    name: offerLetter.hrContactName || 'HR Team',
                    email: offerLetter.hrContactEmail || 'hr@fmpg.com',
                    phone: offerLetter.hrContactPhone || '1234567890'
                }
            ),
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Offer letter emailed with acceptance link to: ${emailRecipient}`);

        try {
            await logAudit({
                req,
                action: "EMAIL",
                resourceEntity: "OfferLetter",
                resourceId: offerLetter._id,
                changes: { recipient: emailRecipient }
            });
        } catch (e) { }

        res.status(200).json({
            message: "Offer letter sent successfully with acceptance link",
            sentTo: emailRecipient,
            acceptanceUrl: acceptanceUrl
        });

    } catch (error) {
        console.error("Error sending email:", error.message);
        res.status(500).json({ message: "Error sending email", error: error.message });
    }
};

// Regenerate acceptance token for offer letter
exports.regenerateAcceptanceToken = async (req, res) => {
    console.log("Regenerate acceptance token for offer letter:", req.params.id);
    try {
        const id = normalizeOfferLetterLookupId(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid offer letter ID" });
        }

        const offerLetter = await OfferLetter.findById(id);
        if (!offerLetter) {
            return res.status(404).json({ message: "Offer letter not found" });
        }

        // Generate new acceptance token
        offerLetter.acceptanceToken = crypto.randomBytes(32).toString('hex');
        await offerLetter.save();

        console.log(`Generated new acceptance token for offer letter ${id}`);

        res.status(200).json({
            message: "Acceptance token regenerated successfully",
            acceptanceToken: offerLetter.acceptanceToken
        });

    } catch (error) {
        console.error("Error regenerating acceptance token:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// Utility function to add acceptance tokens to all offer letters that don't have them
exports.addAcceptanceTokensToExisting = async (req, res) => {
    console.log("Adding acceptance tokens to existing offer letters");
    try {
        // Find all offer letters without acceptance tokens
        const offerLettersWithoutTokens = await OfferLetter.find({
            $or: [
                { acceptanceToken: { $exists: false } },
                { acceptanceToken: null },
                { acceptanceToken: "" }
            ]
        });

        console.log(`Found ${offerLettersWithoutTokens.length} offer letters without acceptance tokens`);

        let updatedCount = 0;
        for (const offerLetter of offerLettersWithoutTokens) {
            offerLetter.acceptanceToken = crypto.randomBytes(32).toString('hex');
            await offerLetter.save();
            updatedCount++;
        }

        res.status(200).json({
            message: `Added acceptance tokens to ${updatedCount} offer letters`,
            updatedCount: updatedCount,
            totalFound: offerLettersWithoutTokens.length
        });

    } catch (error) {
        console.error("Error adding acceptance tokens:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

function calculateDurationText(startDate, endDate) {
    if (!endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) {
        return null;
    }

    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;

    if (months > 0 && days > 0) {
        return `${months} month${months > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    }

    if (months > 0) {
        return `${months} month${months > 1 ? 's' : ''}`;
    }

    return `${totalDays} day${totalDays > 1 ? 's' : ''}`;
}

function getOfferDurationText(offerLetter) {
    const storedDuration = typeof offerLetter.duration === 'string' ? offerLetter.duration.trim() : '';
    if (storedDuration) {
        return storedDuration;
    }

    return calculateDurationText(offerLetter.startDate, offerLetter.endDate || offerLetter.validUntil)
        || 'Until project completion or 3 months (whichever is longer)';
}

function getHrSignatoryName(offerLetter) {
    const hrName = typeof offerLetter.hrContactName === 'string' ? offerLetter.hrContactName.trim() : '';
    const issuedBy = typeof offerLetter.issuedBy === 'string' ? offerLetter.issuedBy.trim() : '';

    return hrName || issuedBy || 'HR Team';
}

// ============================================================
// FMPG — Light-Theme Offer Letter PDF Generator (A4)
// Drop-in replacement for generateOfferLetterPDFInMemory()
// Light/white theme matching fmpg.in aesthetic
// ============================================================

// Colour palette — light theme matching fmpg.in
const C = {
    white:      '#ffffff',
    bg:         '#fafafa',
    bgAccent:   '#f4fac0',   // lime tint panels
    lime:       '#c8e600',   // primary brand lime
    limeDark:   '#8aad00',   // darker lime for text/accents
    limeBorder: '#daf04a',   // lighter lime border
    limeDeep:   '#4a6800',   // deep lime for text on lime bg
    black:      '#111111',
    dark:       '#1a1a1a',
    mid:        '#444444',
    muted:      '#777777',
    subtle:     '#aaaaaa',
    border:     '#ebebeb',
    border2:    '#dddddd',
    rowBg:      '#f9fdf0',   // tinted position card bg
};

const W = 595.28;   // A4 width  (pt)
const H = 841.89;   // A4 height (pt)
const PAD = 40;     // horizontal margin

// ── helpers ──────────────────────────────────────────────────

function roundRect(doc, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    doc.moveTo(x + rr, y)
        .lineTo(x + w - rr, y).quadraticCurveTo(x + w, y, x + w, y + rr)
        .lineTo(x + w, y + h - rr).quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
        .lineTo(x + rr, y + h).quadraticCurveTo(x, y + h, x, y + h - rr)
        .lineTo(x, y + rr).quadraticCurveTo(x, y, x + rr, y)
        .closePath();
}

function fillRR(doc, x, y, w, h, r, fill) {
    roundRect(doc, x, y, w, h, r);
    doc.fill(fill);
}

function strokeRR(doc, x, y, w, h, r, stroke, lw = 0.5) {
    roundRect(doc, x, y, w, h, r);
    doc.lineWidth(lw).strokeColor(stroke).stroke();
}

function pill(doc, x, y, w, h, fill, strokeColor) {
    const r = h / 2;
    if (fill)        fillRR(doc, x, y, w, h, r, fill);
    if (strokeColor) strokeRR(doc, x, y, w, h, r, strokeColor, 0.75);
}

function sectionLabel(doc, text, x, y, totalWidth) {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(C.limeDark);
    doc.text(text.toUpperCase(), x, y + 1, { lineBreak: false, characterSpacing: 1.3 });
    const tw = doc.widthOfString(text.toUpperCase(), { characterSpacing: 1.3 });
    doc.rect(x + tw + 8, y + 4, totalWidth - tw - 8, 0.5).fill(C.border);
}

function detailCell(doc, label, value, x, y, cellW, accent) {
    doc.font('Helvetica').fontSize(7).fillColor(C.subtle);
    doc.text(label.toUpperCase(), x, y, { lineBreak: false, characterSpacing: 0.7 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(accent ? C.limeDark : C.dark);
    doc.text(value, x, y + 12, { lineBreak: false, width: cellW - 10 });
}

function checkmark(doc, cx, cy, size) {
    doc.save();
    doc.lineWidth(1.8).strokeColor(C.dark).lineCap('round').lineJoin('round');
    doc.moveTo(cx - size * 0.38, cy)
       .lineTo(cx - size * 0.05, cy + size * 0.32)
       .lineTo(cx + size * 0.38, cy - size * 0.28)
       .stroke();
    doc.restore();
}

// ── QR code ──────────────────────────────────────────────────

function drawQR(doc, url, qrX, qrY, qrSize) {
    const qrData = QRCode.create(url, { errorCorrectionLevel: 'H' });
    const modules = qrData.modules.size;
    const pad = qrSize * 0.07;
    const effective = qrSize - pad * 2;
    const modSize = effective / modules;

    fillRR(doc, qrX, qrY, qrSize, qrSize, 6, C.bg);
    strokeRR(doc, qrX, qrY, qrSize, qrSize, 6, C.border2, 0.5);

    for (let r = 0; r < modules; r++) {
        for (let c = 0; c < modules; c++) {
            if (!qrData.modules.get(r, c)) continue;
            const tl = r < 7 && c < 7;
            const tr = r < 7 && c >= modules - 7;
            const bl = r >= modules - 7 && c < 7;
            if (tl || tr || bl) continue;
            const cx = qrX + pad + c * modSize + modSize / 2;
            const cy = qrY + pad + r * modSize + modSize / 2;
            doc.circle(cx, cy, (modSize / 2) * 0.82).fill(C.dark);
        }
    }
    // Eyes
    [[0, 0], [0, modules - 7], [modules - 7, 0]].forEach(([er, ec]) => {
        const ex = qrX + pad + (ec + 3.5) * modSize;
        const ey = qrY + pad + (er + 3.5) * modSize;
        doc.circle(ex, ey, 3.5 * modSize).fill(C.dark);
        doc.circle(ex, ey, 2.5 * modSize).fill(C.white);
        doc.circle(ex, ey, 1.5 * modSize).fill(C.limeDark);
    });
}

// ── main PDF function ─────────────────────────────────────────

async function generateOfferLetterPDFInMemory(offerLetter) {
    console.log(`Generating light-theme offer letter PDF for: ${offerLetter.candidateName}`);

    const verifyBase = (process.env.FRONTEND_URL || 'https://careers.fmpg.in').replace(/\/+$/, '');
    const verifyUrl  = `${verifyBase}/verify-offer/${offerLetter._id}`;

    const fmt = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

    const isInternship = (offerLetter.offerType && offerLetter.offerType.toLowerCase() === 'internship') ||
        (offerLetter.position && offerLetter.position.toLowerCase().includes('intern')) ||
        (offerLetter.salary === 0 || offerLetter.salary === '0');

    const isExtended = !!(offerLetter.extensionHistory && offerLetter.extensionHistory.length > 0);

    const salaryLabel = isInternship ? 'Stipend' : 'Annual CTC';
    const salaryValue = (offerLetter.salary === 0 || offerLetter.salary === '0')
        ? 'Unpaid'
        : `Rs.${formatCurrencyValue(offerLetter.salary)}`;
    const payoutSuffix = (isInternship && offerLetter.payoutFrequency) ? ` (${offerLetter.payoutFrequency})` : '';

    const offerTypeLabel = offerLetter.offerType || (isInternship ? 'Internship' : 'Full-time');

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: false,
        info: {
            Title:   `Offer Letter — ${offerLetter.candidateName}`,
            Author:  'FMPG',
            Subject: 'Employment Offer Letter',
        }
    });

    doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });

    const buffers = [];
    doc.on('data', (b) => buffers.push(b));

    // ── BACKGROUND ──────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(C.white);
    // Top lime bar
    doc.rect(0, 0, W, 6).fill(C.lime);
    // Bottom lime bar
    doc.rect(0, H - 6, W, 6).fill(C.lime);

    // ── HEADER STRIP ────────────────────────────────────────
    const headerH = 58;
    const headerY = 6;
    doc.rect(0, headerY, W, headerH).fill(C.white);
    doc.rect(0, headerY + headerH - 0.5, W, 0.5).fill(C.border);

    // ── LOGO (from assets, 140×40 pt reserved zone) ─────────
    const logoX = PAD;
    const logoY = headerY + (headerH - 40) / 2;
    const logoW = 140;
    const logoH = 40;

    try {
        const logoPath = path.join(__dirname, '..', 'assets', 'logo_dryukr.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, logoX, logoY, { fit: [logoW, logoH], align: 'left', valign: 'center' });
        } else {
            // Fallback: lime square + FMPG text
            fillRR(doc, logoX, logoY + 6, 28, 28, 6, C.lime);
            doc.font('Helvetica-Bold').fontSize(14).fillColor(C.dark);
            doc.text('F', logoX + 8, logoY + 14, { lineBreak: false });
            doc.font('Helvetica-Bold').fontSize(18).fillColor(C.dark);
            doc.text('FMPG', logoX + 36, logoY + 11, { lineBreak: false });
        }
    } catch (err) {
        console.warn('Logo load failed:', err.message);
    }

    // Reference — top right
    const refX = W - PAD - 140;
    const refY = headerY + 12;
    doc.font('Helvetica').fontSize(7).fillColor(C.subtle);
    doc.text('REFERENCE', refX, refY, { lineBreak: false, characterSpacing: 0.8 });
    doc.font('Helvetica').fontSize(9).fillColor(C.mid);
    doc.text(`FMPG-OFF-${offerLetter._id.toString().slice(-6).toUpperCase()}`, refX, refY + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor(C.subtle);
    doc.text(`Issued: ${fmt(offerLetter.createdAt)}`, refX, refY + 24, { lineBreak: false });

    // ── BODY ────────────────────────────────────────────────
    let y = headerY + headerH + 22;

    // Tag pill
    const tagText = isExtended ? 'OFFER EXTENSION' : 'OFFICIAL OFFER LETTER';
    doc.font('Helvetica-Bold').fontSize(7);
    const tagTextW = doc.widthOfString(tagText, { characterSpacing: 1.1 });
    const tagW = tagTextW + 34;
    const tagH = 18;
    pill(doc, PAD, y, tagW, tagH, C.bgAccent, C.limeBorder);
    doc.circle(PAD + 10, y + tagH / 2, 3).fill(C.limeDark);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(C.limeDeep);
    doc.text(tagText, PAD + 18, y + 5.5, { lineBreak: false, characterSpacing: 1.1 });
    y += tagH + 8;

    // Headline
    const h1 = isExtended ? 'Your Offer Has Been' : "You're Hired.";
    const h2 = isExtended ? 'Extended.' : 'Welcome to FMPG.';
    doc.font('Helvetica-Bold').fontSize(22).fillColor(C.black);
    doc.text(h1, PAD, y, { lineBreak: false });
    y += 26;
    doc.font('Helvetica-Bold').fontSize(22).fillColor(C.limeDark);
    doc.text(h2, PAD, y, { lineBreak: false });
    y += 28;

    // Lime underline accent
    doc.rect(PAD, y, 36, 3).fill(C.lime);
    y += 10;

    // Greeting
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.dark);
    doc.text(`Dear ${offerLetter.candidateName},`, PAD, y, { lineBreak: false });
    y += 13;

    const introText = isExtended
        ? `We are pleased to inform you that the validity of your offer to join FMPG has been extended. We remain excited about your potential contribution and look forward to welcoming you on board.`
        : `We are delighted to extend this formal offer of appointment to join the FMPG family. Your skills and background impressed our team, and we believe you will be a valuable addition to our growing organization.`;

    doc.font('Helvetica').fontSize(8.5).fillColor(C.muted).lineGap(1);
    doc.text(introText, PAD, y, { width: W - PAD * 2 });
    y += 34;

    // ── POSITION CARD ────────────────────────────────────────
    const cardH = 50;
    fillRR(doc, PAD, y, W - PAD * 2, cardH, 8, C.rowBg);
    doc.rect(PAD, y, 4, cardH).fill(C.lime);
    strokeRR(doc, PAD, y, W - PAD * 2, cardH, 8, C.limeBorder, 0.75);

    // Type badge (dynamic: Internship / Full-time / Contract / Part-time)
    doc.font('Helvetica-Bold').fontSize(7.5);
    const bTW = doc.widthOfString(offerTypeLabel.toUpperCase());
    const badgeW = bTW + 20;
    const badgeX = W - PAD - badgeW - 14;
    const badgeY = y + (cardH - 18) / 2;
    pill(doc, badgeX, badgeY, badgeW, 18, C.bgAccent, C.limeBorder);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.limeDeep);
    doc.text(offerTypeLabel.toUpperCase(), badgeX + 10, badgeY + 5, { lineBreak: false });

    // Position text (truncate width to avoid overlapping badge)
    const posTextMaxW = badgeX - PAD - 26;
    doc.font('Helvetica').fontSize(7).fillColor(C.subtle);
    doc.text('POSITION OFFERED', PAD + 16, y + 9, { lineBreak: false, characterSpacing: 0.8 });
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.black);
    doc.text(offerLetter.position.toUpperCase(), PAD + 16, y + 19, { lineBreak: false, width: posTextMaxW, ellipsis: true });
    if (offerLetter.department) {
        doc.font('Helvetica').fontSize(8).fillColor(C.subtle);
        doc.text(offerLetter.department, PAD + 16, y + 36, { lineBreak: false, width: posTextMaxW, ellipsis: true });
    }

    y += cardH + 14;

    // ── DETAILS GRID ─────────────────────────────────────────
    sectionLabel(doc, 'Offer Details', PAD, y, W - PAD * 2);
    y += 13;

    const details = [
        ['Joining Date', fmt(offerLetter.startDate),                    false],
        ['Duration',     getOfferDurationText(offerLetter),             false],
        [salaryLabel,    salaryValue + payoutSuffix,                    true],
        ['Work Type',    offerLetter.workType || 'On-site',             false],
        ['Location',     offerLetter.joiningLocation || '—',           false],
        ['Reporting To', offerLetter.reportingManager || 'FMPG Team',  false],
    ];

    const gridW = W - PAD * 2;
    const cellW = gridW / 3;
    const cellH = 34;
    const rows  = Math.ceil(details.length / 3);
    const gridH = rows * cellH;

    strokeRR(doc, PAD, y, gridW, gridH, 6, C.border, 0.5);
    for (let c = 1; c < 3; c++) doc.rect(PAD + c * cellW, y, 0.5, gridH).fill(C.border);
    for (let r = 1; r < rows; r++) doc.rect(PAD, y + r * cellH, gridW, 0.5).fill(C.border);

    details.forEach(([label, value, accent], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        detailCell(doc, label, value, PAD + col * cellW + 10, y + row * cellH + 7, cellW, accent);
    });
    y += gridH + 14;

    // ── TERMS ────────────────────────────────────────────────
    sectionLabel(doc, 'Terms & Expectations', PAD, y, W - PAD * 2);
    y += 16;

    const terms = [
        ['Confidentiality', 'Maintain strict confidentiality of all company data and trade secrets during and after your tenure.'],
        ['Code Ownership',  'All work produced during your tenure remains the exclusive intellectual property of FMPG.'],
        ['Professionalism', 'Adhere to our code of conduct and meet agreed performance standards throughout your role.'],
        ['Acceptance',      'This offer is contingent upon successful background verification and validation of credentials.'],
    ];

    const termsH = terms.length * 17 + 14;
    fillRR(doc, PAD, y, W - PAD * 2, termsH, 6, C.bg);
    strokeRR(doc, PAD, y, W - PAD * 2, termsH, 6, C.border, 0.5);

    let ty = y + 10;
    terms.forEach(([title, body]) => {
        doc.circle(PAD + 13, ty + 4.5, 2.5).fill(C.lime);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.mid);
        doc.text(`${title}: `, PAD + 21, ty, { lineBreak: false });
        const tw = doc.widthOfString(`${title}: `);
        doc.font('Helvetica').fontSize(8.5).fillColor(C.muted);
        doc.text(body, PAD + 21 + tw, ty, { lineBreak: false, width: W - PAD * 2 - 32 - tw });
        ty += 17;
    });
    y += termsH + 18;

    // ── ACCEPTANCE BAR ───────────────────────────────────────
    const acceptH = 50;
    fillRR(doc, PAD, y, W - PAD * 2, acceptH, 8, C.bgAccent);
    strokeRR(doc, PAD, y, W - PAD * 2, acceptH, 8, C.limeBorder, 0.75);

    const iconS = 30, iconX = PAD + 12, iconY = y + (acceptH - iconS) / 2;
    fillRR(doc, iconX, iconY, iconS, iconS, 7, C.lime);
    checkmark(doc, iconX + iconS / 2, iconY + iconS / 2, 7);

    const atx = iconX + iconS + 12;
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.limeDeep);
    doc.text('HOW TO ACCEPT', atx, y + 11, { lineBreak: false, characterSpacing: 0.9 });
    doc.font('Helvetica').fontSize(8.5).fillColor(C.muted);
    doc.text('Confirm via the FMPG portal or reply to this offer email with:', atx, y + 22, { lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor(C.mid);
    doc.text('"I accept the offer and agree to the terms and conditions."', atx, y + 34, { lineBreak: false });
    y += acceptH + 20;

    // ── FOOTER SEPARATOR ────────────────────────────────────
    doc.rect(PAD, y, W - PAD * 2, 0.5).fill(C.border);
    y += 16;

    // ── SIGNATURES + QR ─────────────────────────────────────
    const qrSize = 56;

    drawQR(doc, verifyUrl, W / 2 - qrSize / 2, y, qrSize);
    doc.font('Helvetica').fontSize(6.5).fillColor(C.subtle);
    const qrLW = doc.widthOfString('SCAN TO VERIFY', { characterSpacing: 0.7 });
    doc.text('SCAN TO VERIFY', W / 2 - qrLW / 2, y + qrSize + 5, { lineBreak: false, characterSpacing: 0.7 });

    // Left — Founder
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.black);
    doc.text('Om Sharma', PAD, y + 12, { lineBreak: false });
    doc.rect(PAD, y + 28, 110, 0.75).fill(C.border2);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.subtle);
    doc.text('FOUNDER & DIRECTOR', PAD, y + 34, { lineBreak: false, characterSpacing: 0.5 });

    // Right — HR
    const hrName = getHrSignatoryName(offerLetter);
    const hrNW = doc.font('Helvetica-Bold').fontSize(11).widthOfString(hrName);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.black);
    doc.text(hrName, W - PAD - hrNW, y + 12, { lineBreak: false });
    doc.rect(W - PAD - 110, y + 28, 110, 0.75).fill(C.border2);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.subtle);
    const hrRW = doc.widthOfString('HUMAN RESOURCES', { characterSpacing: 0.5 });
    doc.text('HUMAN RESOURCES', W - PAD - hrRW, y + 34, { lineBreak: false, characterSpacing: 0.5 });

    // ── VALIDITY STRIP ───────────────────────────────────────
    const stripY = H - 6 - 22;
    doc.rect(0, stripY, W, 22).fill(C.bg);
    doc.rect(0, stripY, W, 0.5).fill(C.border);

    const validText = `Digitally issued · Valid without physical signature · Valid until ${fmt(offerLetter.validUntil)}`;
    doc.font('Helvetica').fontSize(7.5).fillColor(C.subtle);
    doc.text(validText, PAD, stripY + 7, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.limeDark);
    doc.text('careers.fmpg.in', W - PAD - doc.widthOfString('careers.fmpg.in'), stripY + 7, { lineBreak: false });

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end',   () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
    });
}

// Bulk generate offer letters from CSV
exports.bulkIssueOfferLetters = async (req, res) => {
    console.log("OfferLetter: bulk issue starting");
    const results = [];
    const errors = [];
    let successCount = 0;

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No CSV file uploaded" });
        }

        // Common fields from request body
        const {
            joiningLocation,
            workType,
            validUntil,
            hrContactName,
            hrContactEmail,
            hrContactPhone,
            additionalNotes,
            offerType,
            payoutFrequency,
            sendEmail = false
        } = req.body;

        if (!joiningLocation || !validUntil) {
            return res.status(400).json({ message: "Common fields (Joining Location, Valid Until) are required" });
        }

        const issuerId = req.user.userId;
        const parsedValidUntil = new Date(validUntil);

        // Parse CSV from buffer
        const stream = Readable.from(req.file.buffer);

        await new Promise((resolve, reject) => {
            const parser = csv();
            stream
                .pipe(parser)
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("CSV Parsing Error:", err);
                    reject(err);
                });
        });

        console.log(`CSV parsed: ${results.length} rows found`);

        for (const row of results) {
            try {
                // Trim all keys and values to avoid header/data issues
                const cleanRow = {};
                Object.keys(row).forEach(key => {
                    cleanRow[key.trim()] = row[key] ? row[key].trim() : '';
                });

                const { candidateName, email, position, department, salary, startDate } = cleanRow;

                if (!candidateName || !email || !position || !department || !salary || !startDate) {
                    errors.push({
                        row: cleanRow,
                        error: `Missing required fields: ${[!candidateName && 'candidateName', !email && 'email', !position && 'position', !department && 'department', !salary && 'salary', !startDate && 'startDate'].filter(Boolean).join(', ')}`
                    });
                    continue;
                }

                const parsedStartDate = new Date(startDate);
                if (isNaN(parsedStartDate.getTime())) {
                    errors.push({ row: cleanRow, error: `Invalid startDate format: ${startDate}` });
                    continue;
                }

                const resolvedJoiningLocation = cleanRow.joiningLocation || joiningLocation;
                const resolvedWorkType = cleanRow.workType || workType || 'On-site';
                const resolvedValidUntil = cleanRow.validUntil ? new Date(cleanRow.validUntil) : parsedValidUntil;
                const resolvedHrContactName = cleanRow.hrContactName || hrContactName;
                const resolvedHrContactEmail = cleanRow.hrContactEmail || hrContactEmail;
                const resolvedHrContactPhone = cleanRow.hrContactPhone || hrContactPhone;
                const resolvedAdditionalNotes = cleanRow.additionalNotes || additionalNotes || '';
                const resolvedOfferType = cleanRow.offerType || offerType || 'Job';
                const resolvedPayoutFrequency = cleanRow.payoutFrequency || payoutFrequency || '';

                const resolvedDuration = calculateDurationText(parsedStartDate, resolvedValidUntil)
                    || 'Until project completion or 3 months (whichever is longer)';

                const offerLetter = new OfferLetter({
                    userId: issuerId,
                    candidateName,
                    email,
                    position,
                    department,
                    salary,
                    startDate: parsedStartDate,
                    duration: resolvedDuration,
                    joiningLocation: resolvedJoiningLocation,
                    workType: resolvedWorkType,
                    hrContactName: resolvedHrContactName,
                    hrContactEmail: resolvedHrContactEmail,
                    hrContactPhone: resolvedHrContactPhone,
                    validUntil: resolvedValidUntil,
                    additionalNotes: resolvedAdditionalNotes,
                    offerType: resolvedOfferType,
                    payoutFrequency: resolvedPayoutFrequency
                });

                await offerLetter.save();
                successCount++;

                // Trigger email if requested
                if (sendEmail === 'true' || sendEmail === true) {
                    console.log(`Email feature for bulk is currently manual via dashboard`);
                }

            } catch (err) {
                console.error("Row processing error:", err);
                errors.push({ row, error: err.message });
            }
        }

        res.status(200).json({
            message: `Bulk issuance complete. ${successCount} succeeded, ${errors.length} failed.`,
            successCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error("Bulk Offer Letter Error:", error);
        res.status(500).json({ message: "Server error during bulk issuance", error: error.message });
    }
};

// Download sample CSV for offer letters
exports.downloadOfferSampleCSV = async (req, res) => {
    const headers = "candidateName,email,position,department,salary,startDate,joiningLocation,workType,validUntil,hrContactName,hrContactEmail,hrContactPhone,additionalNotes\n";
    const sampleRow = "John Doe,john@example.com,Software Engineer,Development,800000,2024-06-01,Indore,On-site,2024-05-30,HR Team,hr@example.com,9876543210,Welcome to the team!\n";

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="offer_letter_bulk_sample.csv"');
    res.status(200).send(headers + sampleRow);
};