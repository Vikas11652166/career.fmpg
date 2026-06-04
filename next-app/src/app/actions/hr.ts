"use server";

import connectDB from "@/lib/mongodb";
import User from "@/models/user";
import Job from "@/models/job";
import AuditLog from "@/models/auditLog";
import mongoose from "mongoose";
import { getMeAction } from "./auth";

/**
 * Ensures user is authenticated and is a super-admin.
 */
async function ensureSuperAdmin() {
  const meRes = await getMeAction();
  if (!meRes.success || !meRes.data) {
    throw new Error("Unauthenticated. Please log in first.");
  }
  const user = await User.findById(meRes.data.id);
  if (!user || user.role !== "super-admin") {
    throw new Error("Access denied. Super Admin privileges required.");
  }
  return user;
}

/**
 * Retrieves all users in HR department or with custom HR settings.
 */
export async function getAllHRsAction() {
  try {
    await connectDB();
    await ensureSuperAdmin();

    const hrs = await User.find({
      $or: [{ department: "HR" }, { role: "employee", department: "HR" }]
    }).select("-password").sort({ name: 1 }).lean();

    const serialized = hrs.map((hr: any) => ({
      ...hr,
      _id: hr._id.toString(),
      assignedJobs: hr.assignedJobs?.map((id: any) => id.toString()) || [],
      createdAt: hr.createdAt.toISOString(),
      updatedAt: hr.updatedAt?.toISOString() || hr.createdAt.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get all HRs failed:", error);
    return { success: false, message: error.message || "Failed to load HR staff.", data: [] };
  }
}

/**
 * Promotes a standard user to HR department staff.
 */
export async function promoteToHRAction(data: {
  userId?: string;
  email?: string;
  permissions?: any;
  assignedJobs?: string[];
}) {
  try {
    await connectDB();
    const admin = await ensureSuperAdmin();

    const { userId, email, permissions, assignedJobs } = data;

    let user: any = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return { success: false, message: "User not found." };
    }

    const previousRole = user.role;
    const previousDept = user.department;

    // Promote standard user to employee and set department to HR
    if (user.role === "user") {
      user.role = "employee";
    }
    user.department = "HR";

    // Set standard employee details if missing
    if (!user.employeeId) {
      const employeeCount = await User.countDocuments({
        status: "active",
        employeeId: { $exists: true, $ne: null }
      });
      user.employeeId = `EMP${String(employeeCount + 1).padStart(3, "0")}`;
    }

    if (permissions) {
      user.permissions = { ...user.permissions, ...permissions };
    }
    if (assignedJobs) {
      user.assignedJobs = assignedJobs.map(id => new mongoose.Types.ObjectId(id));
    }

    await user.save();

    // Create Audit Log
    try {
      await AuditLog.create({
        actor: admin._id,
        actorRole: admin.role,
        action: "ASSIGN",
        resourceEntity: "User",
        resourceId: user._id,
        changes: {
          from: { role: previousRole, department: previousDept },
          to: { role: user.role, department: "HR", permissions: user.permissions }
        }
      });
    } catch (auditErr) {}

    return { success: true, message: `User ${user.name} promoted to HR department successfully.` };
  } catch (error: any) {
    console.error("Promote to HR failed:", error);
    return { success: false, message: error.message || "Failed to promote user." };
  }
}

/**
 * Revokes HR access and demotes user privileges.
 */
export async function revokeHRAction(hrId: string) {
  try {
    await connectDB();
    const admin = await ensureSuperAdmin();

    if (!mongoose.Types.ObjectId.isValid(hrId)) {
      return { success: false, message: "Invalid user identifier." };
    }

    const user = await User.findById(hrId);
    if (!user) {
      return { success: false, message: "User not found." };
    }

    if (user.department !== "HR") {
      return { success: false, message: "User is not in the HR department." };
    }

    const previousRole = user.role;
    const previousDept = user.department;
    const previousPerms = { ...user.permissions };

    // Revoke HR privileges
    user.department = "General Administration";
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
    user.assignedJobs = [];

    await user.save();

    // Log Audit action
    try {
      await AuditLog.create({
        actor: admin._id,
        actorRole: admin.role,
        action: "REVOKE",
        resourceEntity: "User",
        resourceId: user._id,
        changes: {
          from: { role: previousRole, department: previousDept, permissions: previousPerms },
          to: { role: user.role, department: user.department, permissions: user.permissions }
        }
      });
    } catch (auditErr) {}

    return { success: true, message: `HR privileges revoked from ${user.name} successfully.` };
  } catch (error: any) {
    console.error("Revoke HR failed:", error);
    return { success: false, message: error.message || "Failed to revoke HR privileges." };
  }
}

/**
 * Configures specific granular permissions and job bounds for HR.
 */
export async function updateHRPermissionsAction(
  hrId: string,
  permissions: any,
  assignedJobs?: string[]
) {
  try {
    await connectDB();
    const admin = await ensureSuperAdmin();

    if (!mongoose.Types.ObjectId.isValid(hrId)) {
      return { success: false, message: "Invalid user identifier." };
    }

    const hr = await User.findById(hrId);
    if (!hr) {
      return { success: false, message: "HR staff profile not found." };
    }

    if (hr.department !== "HR") {
      return { success: false, message: "User is not registered in the HR department." };
    }

    const previousPerms = { ...hr.permissions };
    const previousJobs = hr.assignedJobs?.map(id => id.toString()) || [];

    if (permissions) {
      hr.permissions = {
        canGenerateCertificate: permissions.canGenerateCertificate || false,
        canGenerateOfferLetter: permissions.canGenerateOfferLetter || false,
        canCreateJob: permissions.canCreateJob || false,
        canViewApplicants: permissions.canViewApplicants || false,
        canManageReviews: permissions.canManageReviews || false,
        canManageEmployees: permissions.canManageEmployees || false,
        canManageRecommendations: permissions.canManageRecommendations || false,
        canAccessDashboard: permissions.canAccessDashboard || false
      };
    }

    if (assignedJobs) {
      hr.assignedJobs = assignedJobs.map(id => new mongoose.Types.ObjectId(id));
    }

    await hr.save();

    // Create Audit Log
    try {
      await AuditLog.create({
        actor: admin._id,
        actorRole: admin.role,
        action: "UPDATE_PERMISSIONS",
        resourceEntity: "User",
        resourceId: hr._id,
        changes: {
          from: { permissions: previousPerms, assignedJobs: previousJobs },
          to: { permissions: hr.permissions, assignedJobs: hr.assignedJobs?.map(id => id.toString()) || [] }
        }
      });
    } catch (auditErr) {}

    return { success: true, message: "HR permissions and job configurations updated successfully." };
  } catch (error: any) {
    console.error("Update HR permissions failed:", error);
    return { success: false, message: error.message || "Failed to update configurations." };
  }
}

/**
 * Gets audit logs for HR Department shifts.
 */
export async function getHRAuditLogsAction() {
  try {
    await connectDB();
    await ensureSuperAdmin();

    const logs = await AuditLog.find({
      action: { $in: ["UPDATE_PERMISSIONS", "ASSIGN", "REVOKE"] }
    })
    .populate("actor", "name email")
    .populate("resourceId", "name email")
    .sort({ createdAt: -1 })
    .lean();

    const serialized = logs.map((log: any) => ({
      ...log,
      _id: log._id.toString(),
      actor: log.actor ? {
        _id: log.actor._id.toString(),
        name: log.actor.name,
        email: log.actor.email
      } : null,
      resourceId: log.resourceId ? {
        _id: log.resourceId._id.toString(),
        name: log.resourceId.name,
        email: log.resourceId.email
      } : null,
      createdAt: log.createdAt.toISOString()
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get HR audit logs failed:", error);
    return { success: false, message: error.message || "Failed to load audit logs.", data: [] };
  }
}

/**
 * Retrieves all active jobs for mapping boundaries.
 */
export async function getAvailableJobsForHRAction() {
  try {
    await connectDB();
    await ensureSuperAdmin();

    const jobs = await Job.find({ isActive: true })
      .select("title company _id location")
      .sort({ createdAt: -1 })
      .lean();

    const serialized = jobs.map((j: any) => ({
      ...j,
      _id: j._id.toString()
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error("Get available jobs failed:", error);
    return { success: false, message: error.message || "Failed to load jobs.", data: [] };
  }
}
