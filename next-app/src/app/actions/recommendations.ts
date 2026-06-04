"use server";

import connectDB from "@/lib/mongodb";
import Recommendation from "@/models/recommendation";
import User from "@/models/user";
import Application from "@/models/application";
import AuditLog from "@/models/auditLog";
import mongoose from "mongoose";
import { getMeAction } from "./auth";

/**
 * Ensures user is authenticated and is an active employee.
 */
async function ensureActiveEmployee() {
  const meRes = await getMeAction();
  if (!meRes.success || !meRes.data) {
    throw new Error("Unauthenticated. Please log in first.");
  }
  const user = await User.findById(meRes.data.id);
  if (!user || user.role !== "employee" || user.status !== "active") {
    throw new Error("Access denied. Only active employees can access this feature.");
  }
  return user;
}

/**
 * Gets all recommendations made by the logged-in employee.
 */
export async function getMyRecommendationsAction(status?: string, page = 1, limit = 10) {
  try {
    await connectDB();
    const employee = await ensureActiveEmployee();

    const query: any = { recommender: employee._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const recommendations = await Recommendation.find(query)
      .populate("recommendedUser", "name email")
      .populate("reviewedBy", "name")
      .populate("jobId", "title department location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Recommendation.countDocuments(query);
    const pendingCount = await Recommendation.getActivePendingCount(employee._id);

    const serialized = recommendations.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      recommender: r.recommender.toString(),
      recommendedUser: r.recommendedUser ? {
        _id: r.recommendedUser._id.toString(),
        name: r.recommendedUser.name,
        email: r.recommendedUser.email,
      } : null,
      reviewedBy: r.reviewedBy ? {
        _id: r.reviewedBy._id.toString(),
        name: r.reviewedBy.name,
      } : null,
      jobId: r.jobId ? {
        _id: r.jobId._id.toString(),
        title: r.jobId.title,
        department: r.jobId.department,
        location: r.jobId.location,
      } : null,
      applicationId: r.applicationId ? r.applicationId.toString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    }));

    return {
      success: true,
      data: {
        recommendations: serialized,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          pendingCount
        }
      }
    };
  } catch (error: any) {
    console.error("Get recommendations error:", error);
    return { success: false, message: error.message || "Failed to fetch recommendations.", data: { recommendations: [], pagination: { currentPage: 1, totalPages: 1, totalCount: 0, pendingCount: 0 } } };
  }
}

/**
 * Gets candidate applications available for employee referral.
 */
export async function getAvailableApplicationsForRecommendationAction() {
  try {
    await connectDB();
    const employee = await ensureActiveEmployee();

    // Find applications that don't have recommendations yet and are not submitted by the current user
    const applications = await Application.find({
      status: { $in: ["pending", "reviewing"] }, // Match new application statuses
      recommendationId: { $exists: false },
      userId: { $ne: employee._id }
    })
    .populate("jobId", "title company location department")
    .select("_id fullName email jobId status createdAt userId")
    .sort({ createdAt: -1 })
    .lean();

    const serialized = applications.map((app: any) => ({
      ...app,
      _id: app._id.toString(),
      userId: app.userId ? app.userId.toString() : null,
      jobId: app.jobId ? {
        _id: app.jobId._id.toString(),
        title: app.jobId.title,
        company: app.jobId.company,
        location: app.jobId.location,
        department: app.jobId.department
      } : null,
      createdAt: app.createdAt.toISOString()
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get applications for recommendation error:", error);
    return { success: false, message: error.message || "Failed to retrieve available applications.", data: [] };
  }
}

/**
 * Creates a new recommendation/referral.
 */
export async function createRecommendationAction(data: {
  recommendedUserEmail: string;
  recommendedUserName: string;
  jobId: string;
  recommendationMessage: string;
}) {
  try {
    await connectDB();
    const employee = await ensureActiveEmployee();

    const { recommendedUserEmail, recommendedUserName, jobId, recommendationMessage } = data;

    if (!recommendedUserEmail || !recommendedUserName || !jobId || !recommendationMessage) {
      return { success: false, message: "Missing required recommendation fields." };
    }

    // Check limit of 5 pending recommendations
    const pendingCount = await Recommendation.getActivePendingCount(employee._id);
    if (pendingCount >= 5) {
      return {
        success: false,
        message: "You have reached the maximum limit of 5 pending recommendations. Please wait for administrator review."
      };
    }

    // Find existing candidate application
    const existingApplication = await Application.findOne({
      email: recommendedUserEmail,
      jobId: new mongoose.Types.ObjectId(jobId)
    });

    if (!existingApplication) {
      return {
        success: false,
        message: "No application found for this candidate. Candidates must apply first before being recommended."
      };
    }

    // Self referral check
    if (existingApplication.userId && existingApplication.userId.toString() === employee._id.toString()) {
      return {
        success: false,
        message: "You cannot recommend your own job application."
      };
    }

    // Already referred check
    if (existingApplication.recommendationId) {
      return {
        success: false,
        message: "This application already has an attached recommendation."
      };
    }

    // Existing recommendation check for employee
    const existingRecommendation = await Recommendation.findOne({
      recommender: employee._id,
      applicationId: existingApplication._id
    });

    if (existingRecommendation) {
      return {
        success: false,
        message: "You have already recommended this application."
      };
    }

    // Find or create user profile for candidate
    let recommendedUser = await User.findOne({ email: recommendedUserEmail });
    if (!recommendedUser) {
      const bcrypt = await import("bcryptjs");
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

      recommendedUser = await User.create({
        name: recommendedUserName,
        email: recommendedUserEmail,
        password: hashedTempPassword,
        status: "active",
        isEmailVerified: true
      });
      console.log(`Created new guest user record for recommended user: ${recommendedUserEmail}`);
    }

    // Create the recommendation document
    const newRecommendation = await Recommendation.create({
      recommender: employee._id,
      recommenderId: employee.employeeId || "EMP000",
      recommendedUser: recommendedUser._id,
      recommendedUserEmail,
      recommendedUserName,
      recommendationMessage,
      jobId: new mongoose.Types.ObjectId(jobId),
      applicationId: existingApplication._id
    });

    // Update the application with referral data
    (existingApplication as any).recommendationId = newRecommendation._id;
    (existingApplication as any).isReferred = true;
    (existingApplication as any).referrerEmployeeId = employee.employeeId || "EMP000";
    (existingApplication as any).referralMessage = recommendationMessage;
    await existingApplication.save();

    // Log audit action
    try {
      await AuditLog.create({
        actor: employee._id,
        actorRole: employee.role,
        action: "ASSIGN",
        resourceEntity: "Recommendation",
        resourceId: newRecommendation._id,
        changes: { recommendedUserName, email: recommendedUserEmail, jobId }
      });
    } catch (auditErr) {}

    return {
      success: true,
      message: "Job recommendation submitted successfully!",
      recommendationId: newRecommendation._id.toString()
    };
  } catch (error: any) {
    console.error("Create recommendation error:", error);
    return { success: false, message: error.message || "Server error while creating recommendation." };
  }
}

/**
 * Deletes a pending recommendation (User owns, status pending).
 */
export async function deleteRecommendationAction(id: string) {
  try {
    await connectDB();
    const employee = await ensureActiveEmployee();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, message: "Invalid recommendation identifier." };
    }

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      return { success: false, message: "Recommendation not found." };
    }

    // Must be owner
    if (recommendation.recommender.toString() !== employee._id.toString()) {
      return { success: false, message: "You can only delete your own recommendations." };
    }

    // Must be pending status
    if (recommendation.status !== "pending") {
      return { success: false, message: "You can only delete pending recommendations." };
    }

    // Reset parent application references
    if (recommendation.applicationId) {
      await Application.findByIdAndUpdate(recommendation.applicationId, {
        $unset: {
          recommendationId: 1,
          referrerEmployeeId: 1,
          referralMessage: 1
        },
        $set: {
          isReferred: false
        }
      });
    }

    await Recommendation.findByIdAndDelete(id);

    // Log audit action
    try {
      await AuditLog.create({
        actor: employee._id,
        actorRole: employee.role,
        action: "DELETE",
        resourceEntity: "Recommendation",
        resourceId: new mongoose.Types.ObjectId(id),
        changes: { status: "deleted" }
      });
    } catch (auditErr) {}

    return { success: true, message: "Recommendation deleted successfully!" };
  } catch (error: any) {
    console.error("Delete recommendation error:", error);
    return { success: false, message: error.message || "Failed to delete recommendation." };
  }
}
