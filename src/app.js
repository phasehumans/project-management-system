import express from "express"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}))

import healthcheckRouter from "./routes/healthcheck.routes.js"
import authRouter from "./routes/auth.routes.js"
import projectRouter from "./routes/project.routes.js"
import taskRouter from "./routes/task.routes.js"
import noteRouter from "./routes/note.routes.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/projects", projectRouter)
app.use("/api/v1/tasks", taskRouter)
app.use("/api/v1/notes", noteRouter)

app.use(errorHandler)

export default app