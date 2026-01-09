import { asyncHandler } from "../utils/async-handler.js";
import { ApiErrors } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import { z } from "zod";

const createNote = asyncHandler(async (req, res) => {
  const noteSchema = z.object({
    content: z.string().min(1),
    projectId: z.string().min(1)
  });

  const parseData = noteSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const { content, projectId } = parseData.data;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  const note = await ProjectNote.create({
    content,
    project: projectId,
    createdBy: req.user._id
  });

  return res.status(201).json(
    new ApiResponse(201, note, "Note created successfully")
  );
});

const getProjectNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  const notes = await ProjectNote.find({ project: projectId })
    .populate("createdBy", "-password -refreshToken")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, notes, "Notes retrieved successfully")
  );
});

const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId)
    .populate("createdBy", "-password -refreshToken")
    .populate("project", "name");

  if (!note) {
    throw new ApiErrors(404, "Note not found");
  }

  return res.status(200).json(
    new ApiResponse(200, note, "Note retrieved successfully")
  );
});

const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const updateSchema = z.object({
    content: z.string().min(1).optional()
  });

  const parseData = updateSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const note = await ProjectNote.findById(noteId);

  if (!note) {
    throw new ApiErrors(404, "Note not found");
  }

  if (note.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only note creator can update");
  }

  const updatedNote = await ProjectNote.findByIdAndUpdate(
    noteId,
    parseData.data,
    { new: true }
  ).populate("createdBy", "-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, updatedNote, "Note updated successfully")
  );
});

const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId);

  if (!note) {
    throw new ApiErrors(404, "Note not found");
  }

  if (note.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only note creator can delete");
  }

  await ProjectNote.deleteOne({ _id: noteId });

  return res.status(200).json(
    new ApiResponse(200, {}, "Note deleted successfully")
  );
});

export {
  createNote,
  getProjectNotes,
  getNoteById,
  updateNote,
  deleteNote
};
