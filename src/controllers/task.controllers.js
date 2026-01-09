import { asyncHandler } from "../utils/async-handler.js";
import { ApiErrors } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { Task } from "../models/task.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { SubTask } from "../models/subtask.models.js";
import { z } from "zod";
import { AvailableTaskStatuses } from "../utils/constants.js";

const createTask = asyncHandler(async (req, res) => {
  const taskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    projectId: z.string().min(1),
    assignedToId: z.string().min(1)
  });

  const parseData = taskSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const { title, description, projectId, assignedToId } = parseData.data;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  if (project.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only project creator can create tasks");
  }

  const isMember = await ProjectMember.findOne({
    user: assignedToId,
    project: projectId
  });

  if (!isMember) {
    throw new ApiErrors(400, "User is not a project member");
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedBy: req.user._id,
    assignedTo: assignedToId
  });

  return res.status(201).json(
    new ApiResponse(201, task, "Task created successfully")
  );
});

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  let filter = {};
  if (projectId) {
    filter.project = projectId;
  } else {
    filter.$or = [
      { assignedTo: req.user._id },
      { assignedBy: req.user._id }
    ];
  }

  const tasks = await Task.find(filter)
    .populate("project", "name")
    .populate("assignedTo", "-password -refreshToken")
    .populate("assignedBy", "-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, tasks, "Tasks retrieved successfully")
  );
});

const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId)
    .populate("project", "name")
    .populate("assignedTo", "-password -refreshToken")
    .populate("assignedBy", "-password -refreshToken");

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  const subtasks = await SubTask.find({ task: taskId });

  return res.status(200).json(
    new ApiResponse(200, { task, subtasks }, "Task retrieved successfully")
  );
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const updateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(AvailableTaskStatuses).optional(),
    assignedToId: z.string().optional()
  });

  const parseData = updateSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  if (task.assignedBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only task creator can update");
  }

  const updateData = { ...parseData.data };

  if (parseData.data.assignedToId) {
    const isMember = await ProjectMember.findOne({
      user: parseData.data.assignedToId,
      project: task.project
    });

    if (!isMember) {
      throw new ApiErrors(400, "User is not a project member");
    }

    updateData.assignedTo = updateData.assignedToId;
    delete updateData.assignedToId;
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true })
    .populate("project", "name")
    .populate("assignedTo", "-password -refreshToken")
    .populate("assignedBy", "-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, updatedTask, "Task updated successfully")
  );
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  if (task.assignedBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only task creator can delete");
  }

  await Task.deleteOne({ _id: taskId });
  await SubTask.deleteMany({ task: taskId });

  return res.status(200).json(
    new ApiResponse(200, {}, "Task deleted successfully")
  );
});

const createSubTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  if (!title) {
    throw new ApiErrors(400, "Title is required");
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  const subtask = await SubTask.create({
    title,
    task: taskId,
    createdBy: req.user._id
  });

  return res.status(201).json(
    new ApiResponse(201, subtask, "Subtask created successfully")
  );
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { taskId, subtaskId } = req.params;
  const { title, isCompleted } = req.body;

  const subtask = await SubTask.findById(subtaskId);

  if (!subtask) {
    throw new ApiErrors(404, "Subtask not found");
  }

  if (title) subtask.title = title;
  if (isCompleted !== undefined) subtask.isCompleted = isCompleted;

  await subtask.save();

  return res.status(200).json(
    new ApiResponse(200, subtask, "Subtask updated successfully")
  );
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  const subtask = await SubTask.findById(subtaskId);

  if (!subtask) {
    throw new ApiErrors(404, "Subtask not found");
  }

  await SubTask.deleteOne({ _id: subtaskId });

  return res.status(200).json(
    new ApiResponse(200, {}, "Subtask deleted successfully")
  );
});

export {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask
};
