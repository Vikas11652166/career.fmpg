"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/user";
import { signJWT, verifyJWT } from "@/lib/jwt";
import EmailService from "@/services/emailService";
import AuditLog from "@/models/auditLog";

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export interface ActionResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  requiresVerification?: boolean;
}

/**
 * Registers a new candidate and sends an email verification OTP.
 */
export async function registerAction(formData: any): Promise<ActionResponse> {
  try {
    await connectDB();
    const { name, email, password, phoneNumber } = formData;

    if (!name || !email || !password) {
      return { success: false, message: "All fields are required" };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists with this email address" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: "user",
      isEmailVerified: false,
      emailVerificationOTP: otp,
      emailVerificationOTPExpiry: otpExpiry,
      status: "active",
      permissions: {
        canGenerateCertificate: false,
        canGenerateOfferLetter: false,
        canCreateJob: false,
        canViewApplicants: false,
        canManageReviews: false,
        canManageEmployees: false,
        canManageRecommendations: false,
        canAccessDashboard: false,
      }
    });

    try {
      await EmailService.sendEmailVerificationOTP(email, otp, name);
    } catch (emailError) {
      console.error("Verification email failed during signup:", emailError);
    }

    // Log account creation
    try {
      await AuditLog.create({
        actor: newUser._id,
        actorRole: newUser.role,
        action: "CREATE",
        resourceEntity: "User",
        resourceId: newUser._id,
        changes: { name, email, role: "user" }
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError);
    }

    return {
      success: true,
      message: "Registration successful. Please verify your email with the OTP code sent.",
      requiresVerification: true,
    };
  } catch (error: any) {
    console.error("Register action error:", error);
    return { success: false, message: error.message || "Failed to register" };
  }
}

/**
 * Verifies email using the OTP code.
 */
export async function verifyEmailAction(email: string, otp: string): Promise<ActionResponse> {
  try {
    await connectDB();

    if (!email || !otp) {
      return { success: false, message: "Email and OTP code are required" };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.isEmailVerified) {
      return { success: true, message: "Email is already verified" };
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      return { success: false, message: "Invalid verification code" };
    }

    if (user.emailVerificationOTPExpiry && new Date() > user.emailVerificationOTPExpiry) {
      return { success: false, message: "Verification code has expired. Please request a new one." };
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpiry = null;
    await user.save();

    try {
      await EmailService.sendWelcomeEmail({ email: user.email, name: user.name });
    } catch (err) {
      console.error("Welcome email failed:", err);
    }

    return { success: true, message: "Email verified successfully! You can now log in." };
  } catch (error: any) {
    console.error("Verify email error:", error);
    return { success: false, message: error.message || "Email verification failed" };
  }
}

/**
 * Resends verification OTP code.
 */
export async function resendOTPAction(email: string): Promise<ActionResponse> {
  try {
    await connectDB();

    if (!email) {
      return { success: false, message: "Email is required" };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.isEmailVerified) {
      return { success: false, message: "Email already verified" };
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = otpExpiry;
    await user.save();

    await EmailService.sendEmailVerificationOTP(email, otp, user.name);

    return { success: true, message: "A new OTP code has been sent to your email." };
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return { success: false, message: error.message || "Failed to resend code" };
  }
}

/**
 * Logs in a user, sets secure HttpOnly cookie, and returns user details.
 */
export async function loginAction(formData: any): Promise<ActionResponse> {
  try {
    await connectDB();
    const { email, password } = formData;

    if (!email || !password) {
      return { success: false, message: "Email and password are required" };
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }

    if (user.status === "suspended") {
      return { success: false, message: "Your account is suspended. Please contact FMPG support." };
    }

    if (!user.isEmailVerified) {
      // Prompt user to verify email first
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user.emailVerificationOTP = otp;
      user.emailVerificationOTPExpiry = otpExpiry;
      await user.save();

      try {
        await EmailService.sendEmailVerificationOTP(email, otp, user.name);
      } catch (err) {}

      return {
        success: false,
        message: "Please verify your email before logging in. We've sent a verification code to your inbox.",
        requiresVerification: true,
      };
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return { success: false, message: "Invalid credentials" };
    }

    // Sign JWT
    const payload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const token = await signJWT(payload, "24h");

    // Set secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Log successful login
    try {
      await AuditLog.create({
        actor: user._id,
        actorRole: user.role,
        action: "LOGIN",
        resourceEntity: "User",
        resourceId: user._id,
        changes: { action: "Successful login" }
      });
    } catch (err) {}

    return {
      success: true,
      message: "Login successful",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        permissions: user.permissions ? JSON.parse(JSON.stringify(user.permissions)) : null,
      }
    };
  } catch (error: any) {
    console.error("Login action error:", error);
    return { success: false, message: error.message || "Failed to login" };
  }
}

/**
 * Triggers forgot password OTP code.
 */
export async function forgotPasswordAction(email: string): Promise<ActionResponse> {
  try {
    await connectDB();

    if (!email) {
      return { success: false, message: "Email is required" };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "No account found with this email" };
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = otpExpiry;
    await user.save();

    await EmailService.sendPasswordResetOTP(email, otp, user.name);

    return { success: true, message: "Password reset verification code has been sent to your email." };
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return { success: false, message: error.message || "Failed to request password reset" };
  }
}

/**
 * Resets password using valid reset OTP code.
 */
export async function resetPasswordAction(formData: any): Promise<ActionResponse> {
  try {
    await connectDB();
    const { email, otp, newPassword } = formData;

    if (!email || !otp || !newPassword) {
      return { success: false, message: "All fields are required" };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.passwordResetOTP || user.passwordResetOTP !== otp) {
      return { success: false, message: "Invalid verification code" };
    }

    if (user.passwordResetOTPExpiry && new Date() > user.passwordResetOTPExpiry) {
      return { success: false, message: "Verification code has expired. Please request a new one." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetOTP = null;
    user.passwordResetOTPExpiry = null;
    await user.save();

    return { success: true, message: "Password updated successfully. You can now log in." };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return { success: false, message: error.message || "Failed to reset password" };
  }
}

/**
 * Logs out a user and deletes the secure cookie.
 */
export async function logoutAction(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    return { success: true, message: "Logged out successfully" };
  } catch (error: any) {
    console.error("Logout error:", error);
    return { success: false, message: "Failed to logout" };
  }
}

/**
 * Gets the current authenticated user's profile from the secure JWT cookie.
 */
export async function getMeAction(): Promise<ActionResponse> {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { success: false, message: "Unauthenticated" };
    }

    const realUserPayload = await verifyJWT(token);
    
    if (!realUserPayload) {
      return { success: false, message: "Invalid token" };
    }

    const user = await User.findById(realUserPayload.userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      message: "Profile retrieved",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        permissions: user.permissions ? JSON.parse(JSON.stringify(user.permissions)) : null,
      }
    };
  } catch (error: any) {
    return { success: false, message: "Unauthenticated" };
  }
}

