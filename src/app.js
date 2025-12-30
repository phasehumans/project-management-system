import express from "express"

const app= express()

import healthcheckRouter from "./routes/healthcheck.routes.js"
import authRouter from "./routes/auth.routes.js"


app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/auth", authRouter)



export default app