import {Router} from "express"

const healthcheckRouter = Router()

import {healthCheck} from "../controllers/healthcheck.controllers.js"

healthcheckRouter.get('/', healthCheck)

export default healthcheckRouter