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
// Modern Stylized Offer Letter Generation
// ============================================================

const C = {
    black: '#0d0d0d',
    dark2: '#1c1c1c',
    dark3: '#252525',
    lime: '#d6f300',
    limeDim: '#a8c200',
    white: '#ffffff',
    offWhite: '#e8e8e8',
    gray1: '#aaaaaa',
    gray2: '#666666',
};

const W = 595.28; // A4 Portrait
const H = 841.89;

function roundRect(doc, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    doc.moveTo(x + rr, y)
        .lineTo(x + w - rr, y)
        .quadraticCurveTo(x + w, y, x + w, y + rr)
        .lineTo(x + w, y + h - rr)
        .quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
        .lineTo(x + rr, y + h)
        .quadraticCurveTo(x, y + h, x, y + h - rr)
        .lineTo(x, y + rr)
        .quadraticCurveTo(x, y, x + rr, y)
        .closePath();
}

function textCenter(doc, str, y, opts = {}) {
    const tw = doc.widthOfString(str);
    doc.text(str, (W - tw) / 2, y, { lineBreak: false, ...opts });
}

function hex2rgb(h) {
    const v = parseInt(h.replace('#', ''), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerpColor(a, b, t) {
    const ca = hex2rgb(a), cb = hex2rgb(b);
    return [
        Math.round(ca[0] + (cb[0] - ca[0]) * t),
        Math.round(ca[1] + (cb[1] - ca[1]) * t),
        Math.round(ca[2] + (cb[2] - ca[2]) * t),
    ];
}

function drawBackground(doc) {
    doc.rect(0, 0, W, H).fill(C.black);

    // Decorative circles
    for (let i = 18; i >= 0; i--) {
        const r = 240 * (i / 18);
        const lv = Math.round(8 * (i / 18));
        const col = `#${[lv + 14, lv + 16, 0].map(x => Math.min(x, 255).toString(16).padStart(2, '0')).join('')}`;
        doc.circle(W * 0.9, H * 0.1, r).fill(col);
    }

    for (let i = 14; i >= 0; i--) {
        const r = 180 * (i / 14);
        const lv = Math.round(6 * (i / 14));
        const col = `#${[lv + 12, lv + 14, 0].map(x => Math.min(x, 255).toString(16).padStart(2, '0')).join('')}`;
        doc.circle(W * 0.1, H * 0.9, r).fill(col);
    }

    // Borders
    doc.rect(0, 0, W, 6).fill(C.lime);
    doc.rect(0, H - 6, W, 6).fill(C.lime);
    doc.rect(0, 6, 5, H - 12).fill(C.limeDim);
    doc.rect(W - 5, 6, 5, H - 12).fill(C.limeDim);

    doc.save();
    doc.rect(20, 20, W - 40, H - 40).lineWidth(0.8).strokeColor(C.limeDim).stroke();
    doc.restore();

    // Corner squares
    [[20, 20], [W - 32, 20], [20, H - 32], [W - 32, H - 32]].forEach(([cx, cy]) => {
        doc.rect(cx, cy, 12, 12).fill(C.lime);
    });

    // Logo section
    // Logo section
    const logoX = 40, logoY = 40, logoW = 185, logoH = 40;
    doc.save();
    roundRect(doc, logoX, logoY, logoW, logoH, 10);
    doc.fill(C.dark2);
    doc.restore();

    doc.rect(logoX, logoY, 4, logoH).fill(C.lime);

    // Dynamic Logo Image Integration
    let logoDrawn = false;
    try {
        const logoPath = path.join(__dirname, "..", "assets", "logo_dryukr.png");
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, logoX + 12, logoY + 6, { height: logoH - 12 });
            logoDrawn = true;
        }
    } catch (err) {
        console.error("PDF Logo Error:", err);
    }

    if (!logoDrawn) {
        doc.font('Helvetica-Bold').fontSize(18).fillColor(C.lime);
        doc.text('FMPG', logoX + 12, logoY + 8, { lineBreak: false });
    }

    // FMPG Text
    doc.font('Helvetica-Bold').fontSize(16).fillColor(C.lime);
    doc.text('FMPG', logoX + 55, logoY + 12, { lineBreak: false });
}

function drawQR(doc, url, qrX, qrY, qrSize) {
    const qrData = QRCode.create(url, { errorCorrectionLevel: 'H' });
    const modules = qrData.modules.size;
    const pad = qrSize * 0.028;
    const effective = qrSize - pad * 2;
    const modSize = effective / modules;

    roundRect(doc, qrX, qrY, qrSize, qrSize, 6);
    doc.fill(C.black);

    doc.save();
    roundRect(doc, qrX, qrY, qrSize, qrSize, 6);
    doc.lineWidth(1).strokeColor(C.limeDim).stroke();
    doc.restore();

    const getCol = (row) => lerpColor(C.lime, C.white, row / (modules - 1));

    const drawEye = (row, col) => {
        const cx = qrX + pad + (col + 3.5) * modSize;
        const cy = qrY + pad + (row + 3.5) * modSize;
        const ec = getCol(row + 3.5);
        doc.circle(cx, cy, 3.5 * modSize).fill(ec);
        doc.circle(cx, cy, 2.5 * modSize).fill(C.black);
        doc.circle(cx, cy, 1.5 * modSize).fill(ec);
    };

    for (let r = 0; r < modules; r++) {
        for (let c = 0; c < modules; c++) {
            if (!qrData.modules.get(r, c)) continue;
            const tl = r < 7 && c < 7;
            const tr = r < 7 && c >= modules - 7;
            const bl = r >= modules - 7 && c < 7;
            if (tl || tr || bl) {
                if (r === 0 && c === 0) drawEye(0, 0);
                if (r === 0 && c === modules - 7) drawEye(0, modules - 7);
                if (r === modules - 7 && c === 0) drawEye(modules - 7, 0);
                continue;
            }
            const cx = qrX + pad + c * modSize + modSize / 2;
            const cy = qrY + pad + r * modSize + modSize / 2;
            doc.circle(cx, cy, (modSize / 2) * 0.92).fill(getCol(r));
        }
    }

    const bLen = 10, bW = 1.5, bp = -5;
    [
        [qrX + bp, qrY + bp, 1, 1],
        [qrX + qrSize - bp, qrY + bp, -1, 1],
        [qrX + bp, qrY + qrSize - bp, 1, -1],
        [qrX + qrSize - bp, qrY + qrSize - bp, -1, -1],
    ].forEach(([cx, cy, dx, dy]) => {
        doc.save();
        doc.lineWidth(bW).strokeColor(C.lime);
        doc.moveTo(cx, cy).lineTo(cx + dx * bLen, cy).stroke();
        doc.moveTo(cx, cy).lineTo(cx, cy + dy * bLen).stroke();
        doc.restore();
    });
}

async function generateOfferLetterPDFInMemory(offerLetter) {
    console.log(`Generating stylized offer letter for: ${offerLetter.candidateName}`);

    const verifyBase = (process.env.FRONTEND_URL || 'https://fmpg.vercel.app').replace(/\/+$/, '');
    const verifyUrl = `${verifyBase}/verify-offer/${offerLetter._id}`;

    const fmt = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

    const doc = new PDFDocument({
        size: [W, H],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: false,
        info: {
            Title: `Offer Letter - ${offerLetter.candidateName}`,
            Author: 'FMPG',
            Subject: 'Employment Offer Letter',
        }
    });

    doc.addPage({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 } });

    const buffers = [];
    doc.on('data', (b) => buffers.push(b));

    drawBackground(doc);

    let y = 100;

    // Title
    const isExtended = offerLetter.extensionHistory && offerLetter.extensionHistory.length > 0;
    const titleText = isExtended ? 'OFFER EXTENSION' : 'OFFER LETTER';
    
    doc.font('Helvetica-Bold').fontSize(22).fillColor(C.white);
    doc.text(titleText, 40, y);
    doc.rect(40, y + 28, isExtended ? 100 : 60, 3).fill(C.lime);

    doc.font('Helvetica').fontSize(9).fillColor(C.gray1);
    doc.text(`Ref: FMPG-OFF-${offerLetter._id.toString().slice(-6).toUpperCase()}`, W - 180, y + 5, { align: 'right', width: 140 });
    doc.text(`Issued: ${fmt(offerLetter.createdAt)}`, W - 180, y + 17, { align: 'right', width: 140 });

    y += 60;

    // Candidate Greeting
    doc.font('Helvetica-Bold').fontSize(16).fillColor(C.white);
    doc.text(`Dear ${offerLetter.candidateName},`, 40, y);
    y += 25;

    doc.font('Helvetica').fontSize(10).fillColor(C.gray1).lineGap(4);
    const introText = isExtended 
        ? `We are pleased to inform you that the validity of your offer to join FMPG has been extended. We remain excited about your potential contribution to our team.`
        : `We are delighted to extend this formal offer of appointment to join FMPG. Your skills and background impressed our team, and we believe you will be a valuable addition to our growing organization.`;
    doc.text(introText, 40, y, { width: W - 80 });
    y += 50;

    // Position Highlight
    roundRect(doc, 40, y, W - 80, 50, 8);
    doc.fill(C.dark3);
    doc.save();
    roundRect(doc, 40, y, W - 80, 50, 8);
    doc.lineWidth(0.8).strokeColor(C.limeDim).opacity(0.4).stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(9).fillColor(C.gray2);
    doc.text('POSITION OFFERED', 55, y + 12);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(C.lime);
    doc.text(offerLetter.position.toUpperCase(), 55, y + 24);

    y += 75;

    const isInternship = (offerLetter.offerType && offerLetter.offerType.toLowerCase() === 'internship') ||
        (offerLetter.position && offerLetter.position.toLowerCase().includes('intern')) ||
        (offerLetter.salary === 0 || offerLetter.salary === "0");

    const salaryLabel = isInternship ? 'Stipend' : 'Salary';
    const salaryValue = (offerLetter.salary === 0 || offerLetter.salary === "0")
        ? 'Unpaid'
        : `₹${formatCurrencyValue(offerLetter.salary)}`;

    const payoutInfo = (isInternship && offerLetter.payoutFrequency)
        ? ` (${offerLetter.payoutFrequency})`
        : '';

    const details = [
        ['Joining Date', fmt(offerLetter.startDate)],
        ['Duration', getOfferDurationText(offerLetter)],
        [salaryLabel, salaryValue + payoutInfo],
        ['Work Type', offerLetter.workType || 'On-site'],
        ['Location', offerLetter.joiningLocation],
        ['Reporting To', offerLetter.reportingManager || 'FMPG Team'],
    ];

    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.white);
    doc.text('OFFER DETAILS', 40, y);
    y += 15;
    doc.rect(40, y, W - 80, 0.5).fill(C.limeDim);
    y += 15;

    details.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const curX = 40 + col * (W / 2 - 40);
        const curY = y + row * 35;

        doc.font('Helvetica').fontSize(8).fillColor(C.gray2);
        doc.text(label, curX, curY);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.offWhite);
        doc.text(value, curX, curY + 12);
    });

    y += 120;

    // Terms & Conditions
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.white);
    doc.text('TERMS & EXPECTATIONS', 40, y);
    y += 15;
    doc.rect(40, y, W - 80, 0.5).fill(C.limeDim);
    y += 15;

    const terms = [
        'Confidentiality: You agree to maintain strict confidentiality of all company data and trade secrets.',
        'Code Ownership: All work produced during your tenure remains the exclusive property of FMPG.',
        'Professionalism: You are expected to adhere to our code of conduct and performance standards.',
        'Acceptance: This offer is contingent upon successful verification of your credentials.',
    ];

    terms.forEach(term => {
        doc.circle(45, y + 4, 2).fill(C.lime);
        doc.font('Helvetica').fontSize(9).fillColor(C.gray1);
        doc.text(term, 55, y, { width: W - 100 });
        y += 22;
    });

    y += 30;

    // Acceptance Block
    roundRect(doc, 40, y, W - 80, 60, 8);
    doc.fill(C.dark2);
    doc.save();
    roundRect(doc, 40, y, W - 80, 60, 8);
    doc.lineWidth(1).strokeColor(C.lime).opacity(0.3).stroke();
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white);
    doc.text('HOW TO ACCEPT', 55, y + 12);
    doc.font('Helvetica').fontSize(8).fillColor(C.gray2);
    doc.text('Please confirm your acceptance via our portal or by replying to the offer email with:', 55, y + 24);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.lime);
    doc.text('"I accept the offer and agree to the terms and conditions."', 55, y + 38);

    // Footer Section (Signatures & QR)
    const footerStartY = H - 110;
    const qrSize = 55;
    
    // QR Code for verification (Center)
    drawQR(doc, verifyUrl, W / 2 - qrSize / 2, footerStartY, qrSize);
    doc.font('Helvetica').fontSize(6).fillColor(C.gray2);
    textCenter(doc, 'SCAN TO VERIFY', footerStartY + qrSize + 5);

    // Left Side
    const sigSideY = footerStartY + 15;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.white);
    doc.text('Om Sharma', 40, sigSideY + 15);
    
    doc.save();
    doc.lineWidth(0.8).strokeColor(C.limeDim);
    doc.moveTo(40, sigSideY + 28).lineTo(160, sigSideY + 28).stroke();
    doc.restore();
    
    doc.font('Helvetica').fontSize(8).fillColor(C.gray2);
    doc.text('Founder & Director', 40, sigSideY + 34);

    // Right Side
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.white);
    doc.text(offerLetter.hrContactName || 'HR Team', W - 160, sigSideY + 15, { align: 'right', width: 120 });
    
    doc.save();
    doc.lineWidth(0.8).strokeColor(C.limeDim);
    doc.moveTo(W - 160, sigSideY + 28).lineTo(W - 40, sigSideY + 28).stroke();
    doc.restore();
    
    doc.font('Helvetica').fontSize(8).fillColor(C.gray2);
    doc.text('Human Resources', W - 160, sigSideY + 34, { align: 'right', width: 120 });

    // Final Footer Note
    doc.font('Helvetica').fontSize(7).fillColor(C.gray2);
    textCenter(doc, 'This is a digitally issued offer letter and is valid without a physical signature.', H - 28);

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
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