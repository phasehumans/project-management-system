import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
} from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/members', addProjectMember);
router.delete('/:projectId/members/:memberId', removeProjectMember);

export default router;