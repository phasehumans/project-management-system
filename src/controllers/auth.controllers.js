import { body } from "express-validator";
import { asyncHandler } from "../utils/async-handler.js";
import { userRegistrationValidator } from "../validators/index.js";
import {User} from "../models/user.models.js"
import { ApiErrors } from "../utils/api-errors.js";

const registerUser = asyncHandler(async (req, res) => {
  const {}
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
