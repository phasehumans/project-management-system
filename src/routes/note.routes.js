import { Router } from "express";
import {
  createNote,
  getProjectNotes,
  getNoteById,
  updateNote,
  deleteNote
} from "../controllers/note.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post('/', createNote);
router.get('/:projectId', getProjectNotes);
router.get('/note/:noteId', getNoteById);
router.put('/:noteId', updateNote);
router.delete('/:noteId', deleteNote);

export default router;