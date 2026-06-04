"use server";

import connectDB from "@/lib/mongodb";
import Job from "@/models/job";
import Notification from "@/models/notification";
import { getMeAction } from "./auth";
import mongoose from "mongoose";

type LeanJobQuestion = Record<string, unknown> & {
  _id?: { toString(): string };
};

type LeanJob = Record<string, unknown> & {
  _id: { toString(): string };
  postedBy?: { toString(): string } | null;
  createdAt?: Date;
  updatedAt?: Date;
  questions?: LeanJobQuestion[];
};

function buildPublicJobLookup(slugOrId: string) {
  const trimmed = slugOrId.trim();

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    return {
      isActive: true,
      $or: [
        { _id: new mongoose.Types.ObjectId(trimmed) },
        { slug: trimmed }
      ]
    };
  }

  return { slug: trimmed, isActive: true };
}

function serializeJob(job: any) {
  return {
    ...job,
    _id: job._id.toString(),
    postedBy: job.postedBy ? job.postedBy.toString() : null,
    createdAt: job.createdAt ? job.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: job.updatedAt ? job.updatedAt.toISOString() : (job.createdAt ? job.createdAt.toISOString() : new Date().toISOString()),
    questions: job.questions?.map((q: any) => ({
      ...q,
      _id: q._id ? q._id.toString() : undefined,
    })) || [],
  };
}

// ─────────────────────────────── JOBS ───────────────────────────────

/**
 * Fetches all active public jobs with optional search/filter/sort.
 */
export async function getPublicJobsAction(params?: {
  search?: string;
  type?: string;
  department?: string;
  location?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "title";
}) {
  try {
    await connectDB();

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const search = params?.search || "";
    const filterType = params?.type || "";
    const filterDept = params?.department || "";
    const filterLoc = params?.location || "";
    const sortType = params?.sort || "newest";

    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } }
      ];
    }
    if (filterType) query.type = filterType;
    if (filterDept) query.department = { $regex: filterDept, $options: "i" };
    if (filterLoc) query.location = { $regex: filterLoc, $options: "i" };

    let sortObj: any = { createdAt: -1 };
    if (sortType === "oldest") sortObj = { createdAt: 1 };
    if (sortType === "title") sortObj = { title: 1 };

    const skip = (page - 1) * limit;
    const [jobsRaw, total] = await Promise.all([
      Job.find(query)
        .select("slug title company description location type salary department imageUrl requirements responsibilities createdAt")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query)
    ]);

    const serialized = jobsRaw.map((j: any) => ({
      ...j,
      _id: j._id.toString(),
      postedBy: j.postedBy ? j.postedBy.toString() : null,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt ? j.updatedAt.toISOString() : j.createdAt.toISOString()
    }));

    // Aggregate filter options
    const [types, departments, locations] = await Promise.all([
      Job.distinct("type", { isActive: true }),
      Job.distinct("department", { isActive: true }),
      Job.distinct("location", { isActive: true })
    ]);

    return {
      success: true,
      data: {
        jobs: serialized,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total },
        filters: {
          types: types.filter(Boolean),
          departments: departments.filter(Boolean),
          locations: locations.filter(Boolean)
        }
      }
    };
  } catch (error: any) {
    console.error("Get public jobs failed:", error);
    return { success: false, message: error.message || "Failed to load jobs" };
  }
}

/**
 * Fetches featured/latest jobs for the home page.
 */
export async function getFeaturedJobsAction(limit = 6) {
  try {
    await connectDB();
    const jobs = await Job.find({ isActive: true })
      .select("slug title company location type salary department imageUrl description createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const serialized = jobs.map((j: any) => ({
      ...j,
      _id: j._id.toString(),
      createdAt: j.createdAt.toISOString()
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get featured jobs failed:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetches a single active job by its slug or ObjectId for public pages.
 */
export async function getJobBySlugAction(slugOrId: string) {
  try {
    await connectDB();
    const job = await Job.findOne(buildPublicJobLookup(slugOrId)).lean();

    if (!job) {
      return { success: false, message: "Job not found", data: null };
    }

    return { success: true, data: serializeJob(job) };
  } catch (error: any) {
    console.error("Get job by slug failed:", error);
    return { success: false, message: error.message, data: null };
  }
}

/**
 * Checks if the current user has already applied for a specific job.
 */
export async function checkApplicationStatusAction(jobId: string) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) {
      return { success: true, data: { hasApplied: false } };
    }

    const Application = mongoose.models.Application || (await import("@/models/application")).default;
    const existing = await Application.findOne({
      jobId: new mongoose.Types.ObjectId(jobId),
      $or: [
        { userId: new mongoose.Types.ObjectId(meRes.data.id) },
        { email: meRes.data.email }
      ]
    }).select("_id status").lean();

    return {
      success: true,
      data: {
        hasApplied: !!existing,
        status: existing ? (existing as any).status : null,
        applicationId: existing ? (existing as any)._id.toString() : null
      }
    };
  } catch (error: any) {
    return { success: false, data: { hasApplied: false } };
  }
}

// ────────────────────────── NOTIFICATIONS ──────────────────────────

/**
 * Gets notifications for the current authenticated user.
 */
export async function getUserNotificationsAction(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) {
      return { success: false, data: { notifications: [], unreadCount: 0 } };
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const userId = meRes.data.id;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (params?.unreadOnly) filter.isRead = false;

    const [notificationsRaw, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false })
    ]);

    const serialized = notificationsRaw.map((n: any) => ({
      ...n,
      _id: n._id.toString(),
      userId: n.userId.toString(),
      relatedJobId: n.relatedJobId ? n.relatedJobId.toString() : null,
      relatedApplicationId: n.relatedApplicationId ? n.relatedApplicationId.toString() : null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt ? n.updatedAt.toISOString() : n.createdAt.toISOString()
    }));

    return {
      success: true,
      data: {
        notifications: serialized,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total },
        unreadCount
      }
    };
  } catch (error: any) {
    console.error("Get notifications failed:", error);
    return { success: false, data: { notifications: [], unreadCount: 0 } };
  }
}

/**
 * Gets unread notification count.
 */
export async function getUnreadCountAction() {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, data: { count: 0 } };

    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(meRes.data.id),
      isRead: false
    });

    return { success: true, data: { count } };
  } catch (error: any) {
    return { success: false, data: { count: 0 } };
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationReadAction(notificationId: string) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, message: "Not authenticated" };

    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(meRes.data.id)
    });

    if (!notification) return { success: false, message: "Notification not found" };

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return { success: true, message: "Marked as read" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to mark as read" };
  }
}

/**
 * Marks ALL notifications as read for the current user.
 */
export async function markAllNotificationsReadAction() {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, message: "Not authenticated" };

    const result = await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(meRes.data.id), isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { success: true, message: `${result.modifiedCount} notifications marked as read` };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to mark all as read" };
  }
}

/**
 * Deletes a notification.
 */
export async function deleteNotificationAction(notificationId: string) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, message: "Not authenticated" };

    const deleted = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(meRes.data.id)
    });

    if (!deleted) return { success: false, message: "Notification not found" };
    return { success: true, message: "Notification deleted" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete" };
  }
}

// ────────────────────── REVIEWS (Public + User) ───────────────────

/**
 * Gets all approved reviews (public, for homepage/testimonials).
 */
export async function getApprovedReviewsAction() {
  try {
    await connectDB();
    const Review = mongoose.models.Review || (await import("@/models/review")).default;

    const reviews = await Review.find({ status: "approved" })
      .populate("userId", "name position department")
      .sort({ approvedAt: -1 })
      .limit(20)
      .lean();

    const serialized = reviews.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId ? {
        _id: (r.userId as any)._id.toString(),
        name: (r.userId as any).name,
        position: (r.userId as any).position,
        department: (r.userId as any).department
      } : null,
      createdAt: r.createdAt.toISOString()
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get approved reviews failed:", error);
    return { success: false, data: [] };
  }
}

/**
 * Submits a new review (for employees/offer recipients).
 */
export async function submitReviewAction(reviewData: {
  rating: number;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  designation?: string;
}) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, message: "Not authenticated" };

    const Review = mongoose.models.Review || (await import("@/models/review")).default;

    // Check if already submitted
    const existing = await Review.findOne({ userId: meRes.data.id });
    if (existing) {
      return { success: false, message: "You have already submitted a review" };
    }

    await Review.create({
      userId: new mongoose.Types.ObjectId(meRes.data.id),
      rating: reviewData.rating,
      title: reviewData.title,
      content: reviewData.content,
      pros: reviewData.pros,
      cons: reviewData.cons,
      designation: reviewData.designation || meRes.data.position,
      status: "pending"
    });

    return { success: true, message: "Review submitted successfully! It will appear after admin approval." };
  } catch (error: any) {
    console.error("Submit review failed:", error);
    return { success: false, message: error.message || "Failed to submit review" };
  }
}

/**
 * Gets the current user's own review.
 */
export async function getUserReviewAction() {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, data: null };

    const Review = mongoose.models.Review || (await import("@/models/review")).default;

    const review = await Review.findOne({ userId: meRes.data.id }).lean();
    if (!review) return { success: true, data: null };

    const serialized = {
      ...(review as any),
      _id: (review as any)._id.toString(),
      userId: (review as any).userId.toString(),
      createdAt: (review as any).createdAt.toISOString()
    };

    return { success: true, data: serialized };
  } catch (error: any) {
    return { success: false, data: null };
  }
}

// ────────────────────── USER PROFILE ──────────────────────

/**
 * Updates the current user's profile (name, phone, etc.)
 */
export async function updateProfileAction(profileData: {
  name?: string;
  phone?: string;
  location?: string;
}) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, message: "Not authenticated" };

    const User = mongoose.models.User || (await import("@/models/user")).default;
    const update: any = {};
    if (profileData.name) update.name = profileData.name;
    if (profileData.phone) update.phone = profileData.phone;
    if (profileData.location) update.location = profileData.location;

    await User.findByIdAndUpdate(meRes.data.id, update);
    return { success: true, message: "Profile updated successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update profile" };
  }
}

/**
 * Changes the current user's password.
 */
export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    await connectDB();
    const meRes = await getMeAction();
    if (!meRes.success) return { success: false, message: "Not authenticated" };

    const User = mongoose.models.User || (await import("@/models/user")).default;
    const bcrypt = await import("bcryptjs");

    const user = await User.findById(meRes.data.id);
    if (!user) return { success: false, message: "User not found" };

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) return { success: false, message: "Current password is incorrect" };

    if (data.newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters" };
    }

    user.password = await bcrypt.hash(data.newPassword, 12);
    await user.save();

    return { success: true, message: "Password changed successfully" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to change password" };
  }
}
