"use server";

import connectDB from "@/lib/mongodb";
import Review from "@/models/review";
import User from "@/models/user";
import OfferLetter from "@/models/offerLetter";
import AuditLog from "@/models/auditLog";
import mongoose from "mongoose";
import { getMeAction } from "./auth";

export interface EligibilityResponse {
  eligible: boolean;
  reviewerType?: "employee" | "offer_recipient";
  hasExistingReview?: boolean;
  user?: {
    name: string;
    email: string;
  };
  message?: string;
}

/**
 * Checks review eligibility based on role, status, and offer letters.
 */
export async function checkReviewEligibilityAction(): Promise<EligibilityResponse> {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.data) {
      return { eligible: false, message: "Unauthenticated. Please log in first." };
    }

    const userId = meRes.data.id;
    const user = await User.findById(userId);
    if (!user) {
      return { eligible: false, message: "User profile not found." };
    }

    // 1. Strictly allow users with 'employee' role and active/former status
    if (user.role === "employee" && (user.status === "active" || user.status === "former")) {
      const existingReview = await Review.findOne({ userId: user._id });
      return {
        eligible: true,
        reviewerType: "employee",
        hasExistingReview: !!existingReview,
        user: { name: user.name, email: user.email }
      };
    }

    // 2. Allow offer letter recipients as backup compatibility checks
    const offerLetter = await OfferLetter.findOne({
      $or: [
        { userId: user._id },
        { email: user.email }
      ],
      status: { $in: ["Accepted", "Pending"] }
    });

    if (offerLetter) {
      const existingReview = await Review.findOne({ userId: user._id });
      return {
        eligible: true,
        reviewerType: offerLetter.status === "Accepted" ? "employee" : "offer_recipient",
        hasExistingReview: !!existingReview,
        user: { name: user.name, email: user.email }
      };
    }

    return { 
      eligible: false, 
      message: "Access denied. Only current employees, former employees, or offer letter recipients can submit reviews." 
    };
  } catch (error: any) {
    console.error("Check eligibility error:", error);
    return { eligible: false, message: error.message || "Failed to check eligibility." };
  }
}

/**
 * Fetches user's own submitted review.
 */
export async function getUserReviewAction() {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.data) {
      return { success: false, message: "Unauthenticated." };
    }

    const review = await Review.findOne({ userId: new mongoose.Types.ObjectId(meRes.data.id) }).lean();
    if (!review) {
      return { success: false, message: "No review found.", canSubmit: true };
    }

    // Serialize Dates
    const serialized = {
      ...review,
      _id: review._id.toString(),
      userId: review.userId.toString(),
      approvedBy: review.approvedBy ? review.approvedBy.toString() : null,
      rejectedBy: review.rejectedBy ? review.rejectedBy.toString() : null,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };

    return { success: true, review: serialized, canSubmit: false };
  } catch (error: any) {
    console.error("Get user review error:", error);
    return { success: false, message: error.message || "Failed to fetch review." };
  }
}

/**
 * Submits a new review.
 */
export async function submitReviewAction(formData: {
  rating: number;
  title: string;
  content: string;
  department?: string;
  position?: string;
  workType?: "Remote" | "On-site" | "Hybrid";
  employmentDuration?: string;
  pros?: string;
  cons?: string;
  advice?: string;
  isAnonymous?: boolean;
}) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success || !meRes.data) {
      return { success: false, message: "Unauthenticated. Please log in first." };
    }

    const eligibility = await checkReviewEligibilityAction();
    if (!eligibility.eligible || !eligibility.reviewerType) {
      return { success: false, message: eligibility.message || "You are not eligible to submit reviews." };
    }

    if (eligibility.hasExistingReview) {
      return { success: false, message: "You have already submitted a review." };
    }

    const {
      rating,
      title,
      content,
      department,
      position,
      workType,
      employmentDuration,
      pros,
      cons,
      advice,
      isAnonymous
    } = formData;

    if (!rating || !title || !content) {
      return { success: false, message: "Rating, title, and content are required." };
    }

    if (rating < 1 || rating > 5) {
      return { success: false, message: "Rating must be between 1 and 5." };
    }

    const user = await User.findById(meRes.data.id);
    if (!user) {
      return { success: false, message: "User profile not found." };
    }

    const review = await Review.create({
      userId: user._id,
      userEmail: user.email,
      userName: isAnonymous ? "Anonymous" : user.name,
      rating,
      title,
      content,
      department,
      position,
      workType,
      employmentDuration,
      pros,
      cons,
      advice,
      isAnonymous: isAnonymous || false,
      reviewerType: eligibility.reviewerType,
      status: "pending"
    });

    // Create Audit Log
    try {
      await AuditLog.create({
        actor: user._id,
        actorRole: user.role,
        action: "CREATE",
        resourceEntity: "Review",
        resourceId: review._id,
        changes: { rating, title, reviewerType: eligibility.reviewerType }
      });
    } catch (auditErr) {}

    return { 
      success: true, 
      message: "Review submitted successfully! It will be visible after admin approval.",
      reviewId: review._id.toString() 
    };
  } catch (error: any) {
    console.error("Submit review failed:", error);
    return { success: false, message: error.message || "Failed to submit review." };
  }
}
