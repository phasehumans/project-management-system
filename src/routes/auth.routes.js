import { Router } from "express"
import { forgotPassword, generateKey, getMe, loginUser, logoutUser, registerUser, resetPassword, verifyUser } from "../controllers/auth.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const authRouter = Router()

authRouter.post('/register', registerUser)
authRouter.post('/verify', verifyUser)
authRouter.post('/login', loginUser)
authRouter.post('/logout', verifyJWT, logoutUser)
authRouter.get('/profile', verifyJWT, getMe)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.get('/getkey', verifyJWT, generateKey)

export default authRouter