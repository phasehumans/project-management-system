import { Router } from "express"
import { forgotPassword, generateKey, getMe, loginUser, logoutUser, registerUser, resetPassword, verifyUser } from "../controllers/auth.controllers.js"

const authRouter = Router()

authRouter.post('/register', registerUser)
// authRouter.post('/verify', verifyUser)
// authRouter.post('/login', loginUser)
// authRouter.post('/logout', logoutUser)
// authRouter.get('/profile', getMe)

// authRouter.get('/forgot-password', forgotPassword)
// authRouter.post('/reset-password', resetPassword)

// authRouter.get('/getkey', generateKey)

export default authRouter