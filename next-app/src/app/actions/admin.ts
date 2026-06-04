"use server";

import connectDB from "@/lib/mongodb";
import User from "@/models/user";
import Job from "@/models/job";
import Application from "@/models/application";
import AuditLog from "@/models/auditLog";
import Recommendation from "@/models/recommendation";
import OfferLetter from "@/models/offerLetter";
import OfferContract from "@/models/offerContract";
import Notification from "@/models/notification";
import Review from "@/models/review";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import PDFService from "@/services/pdfService";
import EmailService from "@/services/emailService";
import { getMeAction } from "./auth";
import { serializeDoc } from "@/lib/utils";

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

/**
 * Gets overview metrics and data feeds for the main HR dashboard.
 */
export async function getAdminDashboardMetrics() {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const [
      totalCandidates,
      activeOpenings,
      pendingContracts,
      totalEmployees,
      statusGroup,
      recentLogsRaw
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Job.countDocuments({ isActive: true }),
      OfferContract.countDocuments({ status: "Under_Review" }),
      User.countDocuments({ role: { $in: ["employee", "admin"] } }),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("actor", "name email role")
        .lean()
    ]);

    // Format status distribution
    const statusCounts: Record<string, number> = {
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      rejected: 0,
      offered: 0,
      hired: 0
    };
    statusGroup.forEach((g) => {
      if (g._id && statusCounts[g._id] !== undefined) {
        statusCounts[g._id] = g.count;
      }
    });

    // Format logs
    const recentLogs = recentLogsRaw.map((log: any) => ({
      _id: log._id.toString(),
      actor: log.actor ? {
        _id: log.actor._id.toString(),
        name: log.actor.name,
        email: log.actor.email,
        role: log.actor.role
      } : null,
      action: log.action,
      resourceEntity: log.resourceEntity,
      resourceId: log.resourceId ? log.resourceId.toString() : null,
      changes: log.changes,
      createdAt: log.createdAt.toISOString()
    }));

    return {
      success: true,
      data: {
        metrics: {
          totalCandidates,
          activeOpenings,
          pendingContracts,
          totalEmployees
        },
        statusCounts,
        recentLogs
      }
    };
  } catch (error: any) {
    console.error("Dashboard metrics failed:", error);
    return { success: false, message: error.message || "Failed to fetch metrics" };
  }
}

/**
 * Gets paginated employee list with filter criteria and general staff summaries.
 */
export async function getEmployeesAction(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const page = params.page || 1;
    const limit = params.limit || 10;
    const search = params.search || "";
    const filterRole = params.role || "";
    const filterStatus = params.status || "";

    const query: any = {
      role: { $in: ["employee", "admin", "super-admin"] }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } }
      ];
    }

    if (filterRole) {
      query.role = filterRole;
    }

    if (filterStatus) {
      query.status = filterStatus;
    }

    const skip = (page - 1) * limit;

    const [usersRaw, totalCount, statsGroup] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } },
            former: { $sum: { $cond: [{ $eq: ["$status", "former"] }, 1, 0] } }
          }
        }
      ])
    ]);

    // Construct stats summary
    const stats = {
      totalEmployees: 0,
      totalAdmins: 0,
      totalSuperAdmins: 0,
      activeStaff: 0,
      suspendedAccounts: 0,
      formerEmployees: 0
    };

    statsGroup.forEach((item) => {
      if (item._id === "employee") {
        stats.totalEmployees = item.count;
      } else if (item._id === "admin") {
        stats.totalAdmins = item.count;
      } else if (item._id === "super-admin") {
        stats.totalSuperAdmins = item.count;
      }
      stats.activeStaff += item.active;
      stats.suspendedAccounts += item.suspended;
      stats.formerEmployees += item.former;
    });

    const serializedUsers = serializeDoc(usersRaw);

    return {
      success: true,
      data: {
        users: serializedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount
        },
        stats
      }
    };
  } catch (error: any) {
    console.error("Fetch employees failed:", error);
    return { success: false, message: error.message || "Failed to fetch employees list" };
  }
}

/**
 * Updates an employee's role, permissions, department, position, etc.
 */
export async function updateEmployeeAction(userId: string, updateData: any) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "Employee not found" };
    }

    const previousState = {
      role: user.role,
      status: user.status,
      department: user.department,
      position: user.position,
      positionLevel: user.positionLevel,
      permissions: user.permissions
    };

    // Apply updates
    if (updateData.role) user.role = updateData.role;
    if (updateData.status) user.status = updateData.status;
    if (updateData.department !== undefined) user.department = updateData.department;
    if (updateData.position !== undefined) user.position = updateData.position;
    if (updateData.positionLevel !== undefined) user.positionLevel = updateData.positionLevel;
    if (updateData.permissions) {
      user.permissions = {
        ...user.permissions,
        ...updateData.permissions
      };
    }

    await user.save();

    // Log the audit event
    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action: "UPDATE_PERMISSIONS",
      resourceEntity: "User",
      resourceId: user._id,
      changes: {
        from: previousState,
        to: {
          role: user.role,
          status: user.status,
          department: user.department,
          position: user.position,
          positionLevel: user.positionLevel,
          permissions: user.permissions
        }
      }
    });

    return { success: true, message: "Employee profile and permissions updated successfully" };
  } catch (error: any) {
    console.error("Update employee action failed:", error);
    return { success: false, message: error.message || "Failed to update employee details" };
  }
}

/**
 * Terminates an employee contract (former status).
 */
export async function terminateEmployeeAction(userId: string, data: { reason: string }) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    user.status = "former";
    user.terminatedAt = new Date();
    user.terminationReason = data.reason || "Termination of employment";
    
    // Revoke dashboard permissions
    user.permissions = {
      canGenerateCertificate: false,
      canGenerateOfferLetter: false,
      canCreateJob: false,
      canViewApplicants: false,
      canManageReviews: false,
      canManageEmployees: false,
      canManageRecommendations: false,
      canAccessDashboard: false
    };

    await user.save();

    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action: "REVOKE",
      resourceEntity: "User",
      resourceId: user._id,
      changes: { status: "former", reason: data.reason }
    });

    return { success: true, message: `${user.name} has been marked as former employee` };
  } catch (error: any) {
    console.error("Terminate employee failed:", error);
    return { success: false, message: error.message || "Failed to terminate employee" };
  }
}

/**
 * Imports a batch of employees from parsed CSV file contents.
 */
export async function bulkUploadEmployeesAction(employees: any[]) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();
    let imported = 0;

    for (const emp of employees) {
      if (!emp.email || !emp.name) continue;

      const existing = await User.findOne({ email: emp.email });
      if (existing) {
        // Update details
        if (emp.role) existing.role = emp.role;
        if (emp.department) existing.department = emp.department;
        if (emp.position) existing.position = emp.position;
        if (emp.phoneNumber) existing.phoneNumber = emp.phoneNumber;
        await existing.save();
      } else {
        // Create new user with temp password
        const tempPassword = Math.random().toString(36).slice(-10);
        const hashed = await bcrypt.hash(tempPassword, 10);
        
        await User.create({
          name: emp.name,
          email: emp.email,
          phoneNumber: emp.phoneNumber || "",
          password: hashed,
          role: emp.role || "employee",
          department: emp.department || "Engineering",
          position: emp.position || "SDE",
          status: "active",
          isEmailVerified: true,
          permissions: {
            canGenerateCertificate: false,
            canGenerateOfferLetter: false,
            canCreateJob: false,
            canViewApplicants: true,
            canManageReviews: false,
            canManageEmployees: false,
            canManageRecommendations: false,
            canAccessDashboard: true
          }
        });
      }
      imported++;
    }

    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action: "CREATE",
      resourceEntity: "User",
      changes: { action: "BULK_UPLOAD", count: imported }
    });

    return { success: true, message: `Successfully imported / updated ${imported} employee profiles.` };
  } catch (error: any) {
    console.error("Bulk upload failed:", error);
    return { success: false, message: error.message || "Bulk upload import failed" };
  }
}

/**
 * Retrieves the security Audit Trail logs list.
 */
export async function getAuditLogsAction() {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const logs = await AuditLog.find({})
      .populate("actor", "name email role")
      .populate("resourceId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const serializedLogs = logs.map((log: any) => ({
      _id: log._id.toString(),
      actor: log.actor ? {
        _id: log.actor._id.toString(),
        name: log.actor.name,
        email: log.actor.email,
        role: log.actor.role
      } : null,
      action: log.action,
      resourceEntity: log.resourceEntity,
      resourceId: log.resourceId ? {
        _id: log.resourceId._id.toString(),
        name: log.resourceId.name,
        email: log.resourceId.email
      } : null,
      changes: log.changes,
      createdAt: log.createdAt.toISOString()
    }));

    return { success: true, data: serializedLogs };
  } catch (error: any) {
    console.error("Fetch audit logs failed:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetches all jobs for administration listings.
 */
export async function getJobsAction() {
  try {
    await connectDB();
    const jobs = await Job.find({}).sort({ createdAt: -1 }).lean();
    
    return { success: true, data: serializeDoc(jobs) };
  } catch (error: any) {
    console.error("Fetch admin jobs failed:", error);
    return { success: false, data: [] };
  }
}

/**
 * Saves (creates/updates) a Job Opening post.
 */
export async function saveJobAction(jobId: string | null, jobData: any) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    // Parse multiline text area fields to array
    const requirements = typeof jobData.requirements === "string"
      ? jobData.requirements.split("\n").map((s: string) => s.trim()).filter(Boolean)
      : jobData.requirements;

    const responsibilities = typeof jobData.responsibilities === "string"
      ? jobData.responsibilities.split("\n").map((s: string) => s.trim()).filter(Boolean)
      : jobData.responsibilities;

    const jobPayload = {
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: jobData.description,
      requirements,
      responsibilities,
      salary: jobData.salary,
      type: jobData.type || "Full-time",
      department: jobData.department,
      position: jobData.position,
      questions: jobData.questions || [],
      isActive: jobData.isActive !== undefined ? jobData.isActive : true,
      hrContact: {
        name: jobData.hrContactName || jobData.hrContact?.name || "",
        email: jobData.hrContactEmail || jobData.hrContact?.email || "",
        phone: jobData.hrContactPhone || jobData.hrContact?.phone || ""
      }
    };

    let savedJob;
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      savedJob = await Job.findByIdAndUpdate(jobId, jobPayload, { new: true });
      if (!savedJob) {
        throw new Error("Job opening not found");
      }
      await AuditLog.create({
        actor: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        resourceEntity: "Job",
        resourceId: savedJob._id,
        changes: { title: jobData.title }
      });
    } else {
      // Auto-generate slug from title
      const slug = jobData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      savedJob = await Job.create({ ...jobPayload, slug });
      await AuditLog.create({
        actor: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        resourceEntity: "Job",
        resourceId: savedJob._id,
        changes: { title: jobData.title }
      });
    }

    if (!savedJob) {
      throw new Error("Job opening failed to save");
    }

    return {
      success: true,
      message: "Job details saved successfully",
      data: {
        ...savedJob.toObject(),
        _id: savedJob._id.toString(),
        createdAt: savedJob.createdAt.toISOString(),
        updatedAt: savedJob.updatedAt.toISOString()
      }
    };
  } catch (error: any) {
    console.error("Save job action failed:", error);
    return { success: false, message: error.message || "Failed to save job opening" };
  }
}

/**
 * Fetches applications belonging to a specific job post.
 */
export async function getJobApplicationsAction(jobId: string) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const apps = await Application.find({ jobId })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, data: serializeDoc(apps) };
  } catch (error: any) {
    console.error("Fetch job applications failed:", error);
    return { success: false, data: [] };
  }
}

/**
 * AI recommendations matching engine using semantic keyword matching heuristics.
 * Evaluates candidate experiences and skills directly against Job requirements.
 */
export async function getAIRecommendationsAction(jobId: string) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    // Fetch the logged in user profile to check granular permissions and job scopes
    const actorUser = await User.findById(actor.id);
    if (!actorUser) {
      throw new Error("Recruitment officer profile not found.");
    }

    const isSuperAdmin = actorUser.role === "super-admin";
    const hasViewApplicants = actorUser.permissions?.canViewApplicants || actorUser.permissions?.canManageRecommendations;

    if (!isSuperAdmin) {
      // 1. Check general permissions
      if (!hasViewApplicants) {
        throw new Error("Unauthorized access. Your profile does not possess permissions to view applicant profiles or match insights.");
      }

      // 2. Check assigned jobs bounds for employees
      if (actorUser.role === "employee" && actorUser.assignedJobs && actorUser.assignedJobs.length > 0) {
        const hasJobAccess = actorUser.assignedJobs.some((assignedId: any) => assignedId.toString() === jobId);
        if (!hasJobAccess) {
          throw new Error("Unauthorized access. This job is not in your assigned recruitment queue.");
        }
      }
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return { success: false, message: "Job opening not found" };
    }

    const applications = await Application.find({ jobId }).lean();
    if (applications.length === 0) {
      return { success: true, data: [] };
    }

    // Attempt AI-powered recommendations matching
    const aiMatches = await getAIRecommendationsWithOpenRouter(job, applications);
    if (aiMatches) {
      aiMatches.sort((a: any, b: any) => b.score - a.score);
      return { success: true, data: aiMatches };
    }

    console.log("Falling back to local heuristic matching engine.");

    // Fallback: Local Heuristics Matching Engine
    const jobRequirements = job.requirements || [];
    const jobTitleKeywords = job.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const jobDescKeywords = job.description.toLowerCase().split(/\s+/).filter(w => w.length > 4);

    const matches = applications.map((app: any) => {
      let score = 0;
      const reasons: string[] = [];

      // Skill Keyword Matches (Max 40 points)
      const candidateSkills = (app.skills || []).map((s: string) => s.toLowerCase());
      const requiredSkillsMatches = jobRequirements.filter((req: string) => {
        const reqLower = req.toLowerCase();
        return candidateSkills.some((skill: string) => reqLower.includes(skill));
      });
      const skillScore = Math.min(40, requiredSkillsMatches.length * 10);
      score += skillScore;
      if (requiredSkillsMatches.length > 0) {
        reasons.push(`Matched ${requiredSkillsMatches.length} job skill requirements: (${requiredSkillsMatches.slice(0, 3).join(", ")})`);
      }

      // Experience & Keywords Match (Max 30 points)
      const textBlock = `${app.experience || ""} ${app.education || ""} ${app.coverLetter || ""}`.toLowerCase();
      let keywordCount = 0;
      jobTitleKeywords.forEach(kw => {
        if (textBlock.includes(kw)) keywordCount++;
      });
      jobDescKeywords.slice(0, 15).forEach(kw => {
        if (textBlock.includes(kw)) keywordCount++;
      });
      const keywordScore = Math.min(30, keywordCount * 3);
      score += keywordScore;
      if (keywordCount > 3) {
        reasons.push(`High keyword overlap with job role description (${keywordCount} semantic matches)`);
      }

      // Referral boost (15 points)
      if (app.isReferred) {
        score += 15;
        reasons.push("Recommended directly by a trusted FMPG Employee");
      }

      // Minimum experience match (15 points)
      const expText = (app.experience || "").toLowerCase();
      const jobExpNeeded = jobRequirements.find((r: string) => r.toLowerCase().includes("year") || r.toLowerCase().includes("exp"));
      if (jobExpNeeded) {
        const digits = jobExpNeeded.match(/\d+/);
        if (digits) {
          const needed = parseInt(digits[0]);
          const candDigits = expText.match(/(\d+)\s*year/);
          if (candDigits) {
            const candExp = parseInt(candDigits[1]);
            if (candExp >= needed) {
              score += 15;
              reasons.push(`Exceeds or meets minimum requirement of ${needed} year(s) of experience`);
            }
          }
        }
      }

      const finalScore = Math.min(100, Math.max(10, score));

      return {
        applicationId: app._id.toString(),
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        status: app.status,
        score: finalScore,
        reasons,
        resumeUrl: app.resumeUrl,
        createdAt: app.createdAt.toISOString()
      };
    });

    matches.sort((a, b) => b.score - a.score);
    return { success: true, data: matches };
  } catch (error: any) {
    console.error("AI recommendations engine failed:", error);
    return { success: false, message: error.message || "AI Recommendations Analysis failed" };
  }
}

/**
 * OpenRouter AI-Powered Match Ranker
 */
async function getAIRecommendationsWithOpenRouter(job: any, applications: any[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    console.log("OpenRouter API key not configured, falling back to local heuristics engine.");
    return null;
  }

  try {
    console.log(`Calling OpenRouter AI for candidate match analysis against "${job.title}"...`);

    const matchesPromises = applications.map(async (app: any) => {
      try {
        const systemPrompt = "You are a professional recruiting coordinator. Rate the fit of a candidate application against a specific job opening requirements on a scale from 10 to 100. Output a strict JSON object with a score and a list of specific, professional matching reasons.";
        
        const prompt = `Job Details:
Title: ${job.title}
Department: ${job.department || "General"}
Description: ${job.description}
Requirements: ${Array.isArray(job.requirements) ? job.requirements.join(", ") : job.requirements || ""}

Candidate Profile:
Name: ${app.fullName}
Skills: ${Array.isArray(app.skills) ? app.skills.join(", ") : app.skills || ""}
Experience: ${app.experience || "No experience details"}
Education: ${app.education || "No education details"}
Cover Letter: ${app.coverLetter || "No cover letter provided"}
Direct Referral: ${app.isReferred ? "Yes, referred by an active employee" : "No"}

You MUST evaluate the candidate's skills, experience, and education directly against the job requirements.
Rate the match quality on a scale from 10 to 100 (where 10 is completely unqualified and 100 is an absolute perfect match).
Provide 2-3 specific, bulleted, professional reasons of why they match or why they are scored this way.

Return ONLY a strict valid JSON block, starting with { and ending with }, matching this schema:
{
  "score": number, // integer between 10 and 100
  "reasons": string[] // list of match reasons
}`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://fmpg.in",
            "X-Title": "FMPG Careers Recommendations"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b:free",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 600
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API response error: ${response.statusText}`);
        }

        const resData = await response.json();
        const rawJson = resData.choices[0]?.message?.content?.trim() || "";
        const cleanJson = rawJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        
        const parsed = JSON.parse(cleanJson);
        const finalScore = Math.min(100, Math.max(10, parseInt(parsed.score) || 10));
        
        return {
          applicationId: app._id.toString(),
          fullName: app.fullName,
          email: app.email,
          phone: app.phone,
          status: app.status,
          score: finalScore,
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
          resumeUrl: app.resumeUrl,
          createdAt: app.createdAt.toISOString()
        };
      } catch (err) {
        console.error(`Failed to analyze candidate ${app.fullName} with OpenRouter, falling back:`, err);
        return null;
      }
    });

    const results = await Promise.all(matchesPromises);
    const validResults = results.filter(Boolean);
    
    // If some candidates failed, we fallback to heuristics for safety
    if (validResults.length !== applications.length) {
      console.log("Some candidates could not be analyzed with OpenRouter AI, falling back to heuristics.");
      return null;
    }

    return validResults;
  } catch (err) {
    console.error("OpenRouter AI recommendations analysis failed:", err);
    return null;
  }
}

/**
 * Gets all employee referrals/recommendations.
 */
export async function getAllRecommendationsAction(status?: string) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const recs = await Recommendation.find(query)
      .populate("recommender", "name email employeeId department position")
      .populate("recommendedUser", "name email status")
      .populate("reviewedBy", "name")
      .populate("jobId", "title department location")
      .sort({ createdAt: -1 })
      .lean();

    const serialized = serializeDoc(recs);
    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get recommendations failed:", error);
    return { success: false, data: [] };
  }
}

/**
 * Updates recommendation status (Admin action).
 */
export async function updateRecommendationStatusAction(
  recId: string,
  status: "reviewed" | "selected" | "rejected",
  adminNotes?: string
) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const recommendation = await Recommendation.findById(recId).populate("recommender", "name email");
    if (!recommendation) {
      return { success: false, message: "Recommendation not found" };
    }

    recommendation.status = status;
    recommendation.adminNotes = adminNotes || "";
    recommendation.reviewedBy = new mongoose.Types.ObjectId(actor.id);
    recommendation.reviewedAt = new Date();
    recommendation.updatedAt = new Date();

    await recommendation.save();

    // If selected, create application if not exists
    if (status === "selected") {
      let existingApplication = await Application.findOne({
        email: recommendation.recommendedUserEmail,
        jobId: recommendation.jobId
      });

      if (!existingApplication) {
        const newApplication = (await Application.create({
          userId: recommendation.recommendedUser,
          jobId: recommendation.jobId,
          fullName: recommendation.recommendedUserName,
          email: recommendation.recommendedUserEmail,
          phone: "N/A",
          isReferred: true,
          referrerName: (recommendation.recommender as any).name,
          referrerEmail: (recommendation.recommender as any).email,
          referralMessage: recommendation.recommendationMessage,
          recommendationId: recommendation._id,
          status: "pending"
        })) as any;
        recommendation.applicationId = newApplication._id;
        await recommendation.save();
      } else {
        existingApplication.isReferred = true;
        existingApplication.referrerName = (recommendation.recommender as any).name;
        existingApplication.referrerEmail = (recommendation.recommender as any).email;
        existingApplication.referralMessage = recommendation.recommendationMessage;
        existingApplication.recommendationId = recommendation._id;
        await existingApplication.save();
        
        recommendation.applicationId = existingApplication._id;
        await recommendation.save();
      }
    }

    return { success: true, message: `Recommendation status successfully updated to ${status}` };
  } catch (error: any) {
    console.error("Update recommendation status failed:", error);
    return { success: false, message: error.message || "Failed to update status" };
  }
}

/**
 * Gets aggregate statistics of employee referrals.
 */
export async function getRecommendationStatsAction() {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const statsGroup = await Recommendation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      pending: 0,
      reviewed: 0,
      selected: 0,
      rejected: 0
    };

    statsGroup.forEach((item) => {
      stats.total += item.count;
      if (item._id === "pending") stats.pending = item.count;
      else if (item._id === "reviewed") stats.reviewed = item.count;
      else if (item._id === "selected") stats.selected = item.count;
      else if (item._id === "rejected") stats.rejected = item.count;
    });

    return { success: true, data: { stats } };
  } catch (error: any) {
    console.error("Recommendation stats calculation failed:", error);
    return { success: false, message: "Recommendation stats retrieval error" };
  }
}

/**
 * Issues an offer letter, generates PDF in memory, sends email, and updates application status.
 */
export async function issueOfferLetterAction(applicationId: string, offerData: any) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    let application: any = null;
    if (applicationId && applicationId !== "custom-issue" && mongoose.Types.ObjectId.isValid(applicationId)) {
      application = await Application.findById(applicationId).populate("jobId");
      if (!application) {
        return { success: false, message: "Application not found" };
      }
    }

    const {
      candidateName,
      email,
      position,
      department,
      salary,
      offerType,
      payoutFrequency,
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
      additionalNotes
    } = offerData;

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    const parsedValidUntil = new Date(validUntil);

    // Calculate resolved duration
    let resolvedDuration = duration || "";
    if (!resolvedDuration && parsedEndDate) {
      const diffMs = parsedEndDate.getTime() - parsedStartDate.getTime();
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

    // Create unique shortId
    const shortId = new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase();

    // Create the OfferLetter document
    const offerLetter = await OfferLetter.create({
      userId: (application && application.userId) ? application.userId : new mongoose.Types.ObjectId(actor.id),
      applicationId: application ? application._id : undefined,
      candidateName,
      email,
      position,
      department,
      salary: String(salary),
      offerType: offerType || "Job",
      payoutFrequency: payoutFrequency || "",
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      duration: resolvedDuration,
      joiningLocation: joiningLocation || "On-site",
      workType: workType || "On-site",
      benefits: Array.isArray(benefits) ? benefits : [],
      reportingManager: reportingManager || "FMPG HR Team",
      hrContactName: hrContactName || "HR Team",
      hrContactEmail: hrContactEmail || "contact@fmpg.in",
      hrContactPhone: hrContactPhone || "1234567890",
      validUntil: parsedValidUntil,
      additionalNotes: additionalNotes || "",
      status: "Pending",
      shortId,
      acceptanceToken: crypto.randomBytes(32).toString('hex')
    });

    // Generate in-memory PDF via PDFService
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await PDFService.generateOfferLetter(
        {
          fullName: candidateName,
          email,
          phone: (application && application.phone) ? application.phone : "N/A",
          moreInfo: {}
        },
        {
          title: position,
          department,
          salary,
          offerType,
          startDate: parsedStartDate,
          validUntil: parsedValidUntil,
          joiningLocation,
          workType,
          benefits: Array.isArray(benefits) ? benefits : [],
          reportingManager,
          hrContact: {
            name: hrContactName,
            email: hrContactEmail,
            phone: hrContactPhone
          },
          duration: resolvedDuration,
          additionalNotes
        }
      );
      
      // Save PDF Buffer in document
      offerLetter.pdfBuffer = pdfBuffer;
      offerLetter.pdfGeneratedAt = new Date();
      await offerLetter.save();
    } catch (pdfErr: any) {
      console.error("PDF letter generation failed, continuing without attachment:", pdfErr);
      pdfBuffer = Buffer.from("PDF Generation Error");
    }

    // Link offer inside the application and update status if application exists
    if (application) {
      application.offerLetterId = offerLetter._id;
      application.status = "offered";
      await application.save();
    }

    // Send the email with the PDF attachment!
    try {
      const acceptanceLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contract/${offerLetter._id}`;
      await EmailService.sendOfferLetter(
        { fullName: candidateName, email, name: candidateName },
        { title: position },
        pdfBuffer,
        acceptanceLink,
        parsedValidUntil,
        {
          name: hrContactName,
          email: hrContactEmail,
          phone: hrContactPhone
        }
      );
    } catch (emailErr) {
      console.error("Email send failed during offer letter issue:", emailErr);
    }

    // Log the audit issue
    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action: "ISSUE",
      resourceEntity: "OfferLetter",
      resourceId: offerLetter._id,
      changes: { new: { candidateName, position, status: "Pending" } }
    });

    // Notification to candidate if user exists
    const candidateUser = await User.findOne({ email });
    if (candidateUser) {
      await Notification.create({
        userId: candidateUser._id,
        type: "application_status",
        title: "Employment Offer Issued",
        message: `Congratulations! An employment offer has been issued for "${position}". Please review and sign your contract.`,
        relatedApplicationId: application ? application._id : undefined,
        priority: "high"
      });
    }

    return {
      success: true,
      message: "Offer letter issued and emailed to the candidate successfully",
      data: {
        offerLetterId: offerLetter._id.toString()
      }
    };
  } catch (error: any) {
    console.error("Issue offer letter action failed:", error);
    return { success: false, message: error.message || "Failed to issue offer letter" };
  }
}

/**
 * Fetches application detail by ID with population for review
 */
export async function getApplicationDetailAction(appId: string) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return { success: false, message: "Invalid application identifier" };
    }

    const app = await Application.findById(appId)
      .populate("jobId")
      .populate("offerLetterId")
      .lean();

    if (!app) {
      return { success: false, message: "Application not found" };
    }

    return { success: true, data: serializeDoc(app) };
  } catch (error: any) {
    console.error("Get application details failed:", error);
    return { success: false, message: error.message || "Failed to fetch details" };
  }
}

/**
 * Gets all applications with optional filters for admin review.
 */
export async function getAllApplicationsAction(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  jobId?: string;
}) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const search = params?.search || "";
    const filterStatus = params?.status || "";
    const filterJobId = params?.jobId || "";

    const query: any = {};
    if (filterStatus) query.status = filterStatus;
    if (filterJobId && mongoose.Types.ObjectId.isValid(filterJobId)) {
      query.jobId = new mongoose.Types.ObjectId(filterJobId);
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const [appsRaw, totalCount] = await Promise.all([
      Application.find(query)
        .populate("jobId", "title company location department type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query)
    ]);

    // Status counts
    const statusCounts = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statusSummary: Record<string, number> = {
      pending: 0, reviewing: 0, shortlisted: 0, offered: 0, hired: 0, rejected: 0
    };
    statusCounts.forEach((s) => {
      if (s._id && statusSummary[s._id] !== undefined) {
        statusSummary[s._id] = s.count;
      }
    });

    const serialized = serializeDoc(appsRaw);

    return {
      success: true,
      data: {
        applications: serialized,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount
        },
        statusSummary
      }
    };
  } catch (error: any) {
    console.error("Get all applications failed:", error);
    return { success: false, message: error.message || "Failed to fetch applications" };
  }
}

/**
 * Updates an application's review status (shortlist, reject, hire, etc.).
 */
export async function updateApplicationStatusAction(
  applicationId: string,
  status: string,
  notes?: string
) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const validStatuses = ["pending", "reviewing", "shortlisted", "offered", "hired", "rejected"];
    if (!validStatuses.includes(status)) {
      return { success: false, message: "Invalid application status" };
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return { success: false, message: "Application not found" };
    }

    const previousStatus = application.status;
    application.status = status as typeof application.status;
    if (notes) (application as any).hrNotes = notes;
    await application.save();

    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action: "STATUS_CHANGE",
      resourceEntity: "Application",
      resourceId: application._id,
      changes: { from: { status: previousStatus }, to: { status } }
    });

    // Notify applicant
    if (application.userId) {
      await Notification.create({
        userId: application.userId,
        type: "application_status",
        title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your application status has been updated to "${status}".`,
        relatedApplicationId: application._id,
        priority: status === "rejected" ? "low" : "high"
      });
    }

    return { success: true, message: `Application status updated to ${status}` };
  } catch (error: any) {
    console.error("Update application status failed:", error);
    return { success: false, message: error.message || "Status update failed" };
  }
}

/**
 * Gets all reviews (admin) with filtering.
 */
export async function getAllReviewsAction(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const filterStatus = params?.status || "";

    const query: any = {};
    if (filterStatus) query.status = filterStatus;

    const [reviewsRaw, total] = await Promise.all([
      Review.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(query)
    ]);

    const serialized = reviewsRaw.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId ? {
        _id: (r.userId as any)._id.toString(),
        name: (r.userId as any).name,
        email: (r.userId as any).email
      } : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString() || r.createdAt.toISOString()
    }));

    return { success: true, data: { reviews: serialized, total, page, limit } };
  } catch (error: any) {
    console.error("Get all reviews failed:", error);
    return { success: false, data: { reviews: [], total: 0, page: 1, limit: 20 } };
  }
}

/**
 * Approves or rejects a candidate review.
 */
export async function updateReviewStatusAction(
  reviewId: string,
  status: "approved" | "rejected",
  notes?: string
) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    const review = await Review.findById(reviewId);
    if (!review) {
      return { success: false, message: "Review not found" };
    }

    review.status = status;
    if (status === "approved") {
      review.approvedBy = new mongoose.Types.ObjectId(actor.id);
      review.approvedAt = new Date();
    } else {
      review.rejectedBy = new mongoose.Types.ObjectId(actor.id);
      review.rejectedAt = new Date();
      review.rejectionReason = notes || "Does not meet guidelines";
    }
    if (notes) review.moderatorNotes = notes;
    await review.save();

    return { success: true, message: `Review ${status} successfully` };
  } catch (error: any) {
    console.error("Update review status failed:", error);
    return { success: false, message: error.message || "Failed to update review" };
  }
}

/**
 * Deletes a user account (super-admin only).
 */
export async function deleteUserAction(userId: string) {
  try {
    await connectDB();
    const actor = await ensureAdminOrEmployee();

    if (actor.role !== "super-admin") {
      return { success: false, message: "Only Super Admins can delete user accounts." };
    }

    if (actor.id === userId) {
      return { success: false, message: "You cannot delete your own account." };
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    await AuditLog.create({
      actor: actor.id,
      actorRole: actor.role,
      action: "DELETE",
      resourceEntity: "User",
      resourceId: new mongoose.Types.ObjectId(userId),
      changes: { deleted: { name: user.name, email: user.email } }
    });

    return { success: true, message: `User ${user.name} deleted successfully` };
  } catch (error: any) {
    console.error("Delete user failed:", error);
    return { success: false, message: error.message || "Failed to delete user" };
  }
}

/**
 * Gets all applicant users (role=user) with pagination.
 */
export async function getCandidatesAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  applicationStatus?: string;
}) {
  try {
    await connectDB();
    await ensureAdminOrEmployee();

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const search = params?.search || "";

    const query: any = { role: "user" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const [usersRaw, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query)
    ]);

    const userIds = usersRaw.map((u: any) => u._id);
    const latestApps = await Application.find({ userId: { $in: userIds } })
      .select("userId status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const latestAppMap = new Map<string, string>();
    latestApps.forEach((app: any) => {
      const uid = app.userId.toString();
      if (!latestAppMap.has(uid)) latestAppMap.set(uid, app.status);
    });

    const serialized = usersRaw.map((u: any) => ({
      ...u,
      _id: u._id.toString(),
      applicationStatus: latestAppMap.get(u._id.toString()) || "Not Applied",
      createdAt: u.createdAt.toISOString(),
      terminatedAt: u.terminatedAt ? u.terminatedAt.toISOString() : null
    }));

    return {
      success: true,
      data: { users: serialized, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total } }
    };
  } catch (error: any) {
    console.error("Get candidates failed:", error);
    return { success: false, message: error.message || "Failed to fetch candidates" };
  }
}
