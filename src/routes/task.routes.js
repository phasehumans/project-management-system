import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask
} from "../controllers/task.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.post('/:taskId/subtasks', createSubTask);
router.put('/:taskId/subtasks/:subtaskId', updateSubTask);
router.delete('/subtasks/:subtaskId', deleteSubTask);

export default router;