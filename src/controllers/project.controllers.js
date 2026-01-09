import { asyncHandler } from "../utils/async-handler.js";
import { ApiErrors } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { z } from "zod";

const createProject = asyncHandler(async (req, res) => {
  const projectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
  });

  const parseData = projectSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const { name, description } = parseData.data;

  const existingProject = await Project.findOne({ name });
  if (existingProject) {
    throw new ApiErrors(409, "Project with this name already exists");
  }

  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id
  });

  await ProjectMember.create({
    user: req.user._id,
    project: project._id,
    role: "project_admin"
  });

  return res.status(201).json(
    new ApiResponse(201, project, "Project created successfully")
  );
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectMember.find({ user: req.user._id })
    .populate("project")
    .select("project role");

  return res.status(200).json(
    new ApiResponse(200, projects, "Projects retrieved successfully")
  );
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId)
    .populate("createdBy", "-password -refreshToken");

  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  const isMember = await ProjectMember.findOne({
    user: req.user._id,
    project: projectId
  });

  if (!isMember && project.createdBy._id.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "You don't have access to this project");
  }

  const members = await ProjectMember.find({ project: projectId })
    .populate("user", "-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, { project, members }, "Project retrieved successfully")
  );
});

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional()
  });

  const parseData = updateSchema.safeParse(req.body);

  if (!parseData.success) {
    throw new ApiErrors(400, "Invalid data", parseData.error.errors);
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  if (project.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only project creator can update");
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    parseData.data,
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, updatedProject, "Project updated successfully")
  );
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  if (project.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only project creator can delete");
  }

  await Project.deleteOne({ _id: projectId });
  await ProjectMember.deleteMany({ project: projectId });

  return res.status(200).json(
    new ApiResponse(200, {}, "Project deleted successfully")
  );
});

const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  if (project.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only project creator can add members");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  const existingMember = await ProjectMember.findOne({
    user: userId,
    project: projectId
  });

  if (existingMember) {
    throw new ApiErrors(409, "User is already a member");
  }

  const member = await ProjectMember.create({
    user: userId,
    project: projectId,
    role: role || "member"
  });

  return res.status(201).json(
    new ApiResponse(201, member, "Member added successfully")
  );
});

const removeProjectMember = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  if (project.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "Only project creator can remove members");
  }

  await ProjectMember.deleteOne({
    _id: memberId,
    project: projectId
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Member removed successfully")
  );
});

export {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
};
