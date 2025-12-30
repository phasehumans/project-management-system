import { asyncHandler } from "../utils/async-handler.js";
import {success, z} from "zod"
import {User, generateTemporaryToken} from "../models/user.models.js"
import bcrypt from "bcryptjs";
import { emailVerificationMailgenContent, sendMail } from "../utils/mail.js";


const registerUser = asyncHandler(async (req, res) => {
  const registerSchema = z.object({
    username: z.string(),
    email: z.string().email().min(3).max(20),
    fullname: z.string(),
    password: z.string().min(3).max(20),
    // avatar : z.string()
  });

  const parseData = registerSchema.safeParse(req.body);

  if (!parseData.success) {
    return res.status(400).json({
      success: false,
      message: 'invalid data',
      errors: parseData.error,
    });
  }

  const { username, email, fullname, password, avatar } = parseData.data;

  const isExistingUser = await User.findOne({
    email: email,
  });

  if (isExistingUser) {
    return res.status(403).json({
      success: false,
      message: 'user already exists',
    });
  }

  const hashPassword = await bcrypt.hash(password, 5);

  const newUser = await User.create({
    username: username,
    fullname: fullname,
    email: email,
    password: hashPassword,
    avatar: avatar,
  });

  const verfiyUrl = generateTemporaryToken();

  const content = emailVerificationMailgenContent(username, verfiyUrl);

  const emailSent = await sendMail(content);

  if (!emailSent) {
    return res.status(400).json({
      success: false,
      message: 'error while sending verification email',
    });
  }

  return res.status(200).json({
    success : true,
    message : "verification email sent"
  })
});


const verifyUser= asyncHandler(async (req, res) =>{

})

const loginUser= asyncHandler(async (req, res) =>{

})

const getMe= asyncHandler(async (req, res) =>{

})

const logoutUser= asyncHandler(async (req, res) =>{

})

const forgotPassword= asyncHandler(async (req, res) =>{

})

const resetPassword= asyncHandler(async (req, res) => {

})


const generateKey = asyncHandler(async (req, res) => {

})

export { registerUser, verifyUser, loginUser, getMe, logoutUser, forgotPassword, resetPassword, generateKey};
