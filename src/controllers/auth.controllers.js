import { asyncHandler } from "../utils/async-handler.js";
import { z } from "zod"
import { User } from "../models/user.models.js"
import bcrypt from "bcryptjs";
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendMail } from "../utils/mail.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiErrors } from "../utils/api-errors.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const registerUser = asyncHandler(async (req, res) => {
  const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    fullname: z.string().min(1),
    password: z.string().min(6),
  });

  const parseData = registerSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const { username, email, fullname, password } = parseData.data;

  const isExistingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (isExistingUser) {
    throw new ApiErrors(409, "User already exists with email or username");
  }

  const newUser = await User.create({
    username,
    fullname,
    email,
    password,
  });

  const { unHashedToken, hashedToken, tokenExpiry } = newUser.generateTemporaryToken();

  newUser.emailVerificationToken = hashedToken;
  newUser.emailVerificationExpiry = tokenExpiry;
  await newUser.save();

  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${unHashedToken}`;

  const content = emailVerificationMailgenContent(username, verificationUrl);

  await sendMail({
    email,
    subject: "Email Verification",
    mailgenContent: content
  });

  return res.status(201).json(
    new ApiResponse(201, { userId: newUser._id }, "User registered. Verification email sent.")
  );
});


const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiErrors(400, "Verification token is required");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiErrors(400, "Token expired or invalid");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Email verified successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });

  const parseData = loginSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const { email, password } = parseData.data;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiErrors(401, "Invalid credentials");
  }

  const isPasswordValid = await user.isPassCorrect(password);

  if (!isPasswordValid) {
    throw new ApiErrors(401, "Invalid credentials");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      },
      accessToken,
      refreshToken
    }, "User logged in successfully")
  );
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");

  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "User retrieved successfully")
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } }
  );

  return res.status(200).json(
    new ApiResponse(200, {}, "User logged out successfully")
  );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiErrors(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${unHashedToken}`;

  const content = forgotPasswordMailgenContent(user.username, resetUrl);

  await sendMail({
    email,
    subject: "Password Reset",
    mailgenContent: content
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset email sent")
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    throw new ApiErrors(400, "Token and password fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiErrors(400, "Passwords do not match");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiErrors(400, "Token expired or invalid");
  }

  user.password = newPassword;
  user.forgotPasswordToken = null;
  user.forgotPasswordExpiry = null;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset successfully")
  );
});


const generateKey = asyncHandler(async (req, res) => {
  const accessToken = req.user.generateAccessToken();
  const refreshToken = req.user.generateRefreshToken();

  req.user.refreshToken = refreshToken;
  await req.user.save();

  return res.status(200).json(
    new ApiResponse(200, { accessToken, refreshToken }, "Keys generated successfully")
  );
});

export { registerUser, verifyUser, loginUser, getMe, logoutUser, forgotPassword, resetPassword, generateKey };
