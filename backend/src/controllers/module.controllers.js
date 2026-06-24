import { Module } from "../models/module.models.js";
import { Program } from "../models/program.models.js";
import { Resource } from "../models/resource.models.js";
import { Assignment } from "../models/assignment.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createModule = asyncHandler(async (req, res) => {
  const { name, description, program, order } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Module name cannot be empty!!");
  }

  if (!program) {
    throw new ApiError(400, "Program is required!!");
  }

  if (order === undefined || order === null) {
    throw new ApiError(400, "Order is required!!");
  }

  const existingProgram = await Program.findById(program);
  if (!existingProgram) {
    throw new ApiError(404, "Program doesn't exist!!");
  }

  const duplicateOrder = await Module.findOne({ program, order });
  if (duplicateOrder) {
    throw new ApiError(
      409,
      `A module with order ${order} already exists in this program`,
    );
  }

  const module = await Module.create({
    name: name.trim(),
    description: description?.trim(),
    program,
    order,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, module, "Module created successfully."));
});

const getAllModules = asyncHandler(async (req, res) => {
  const { program } = req.query;
  const filter = program ? { program } : {};

  const modules = await Module.find(filter)
    .sort({ order: 1 })
    .populate("program");

  return res
    .status(200)
    .json(new ApiResponse(200, modules, "Modules fetched."));
});

const getModuleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const module = await Module.findById(id).populate("program");

  if (!module) {
    throw new ApiError(404, "Module not found!!");
  }

  return res.status(200).json(new ApiResponse(200, module, "Module fetched."));
});

const updateModule = asyncHandler(async (req, res) => {
  const { name, description, order } = req.body;
  const { id } = req.params;

  const module = await Module.findById(id);

  if (!module) {
    throw new ApiError(404, "Module doesn't exist!!");
  }

  if (name !== undefined) {
    if (!name.trim()) {
      throw new ApiError(400, "Module name cannot be empty!!");
    }
    module.name = name.trim();
  }

  if (description !== undefined) {
    module.description = description.trim();
  }

  if (order !== undefined) {
    const duplicateOrder = await Module.findOne({
      program: module.program,
      order,
      _id: { $ne: id },
    });
    if (duplicateOrder) {
      throw new ApiError(
        409,
        `A module with order ${order} already exists in this program`,
      );
    }
    module.order = order;
  }

  await module.save();

  return res
    .status(200)
    .json(new ApiResponse(200, module, "Module updated successfully."));
});

const deleteModule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const module = await Module.findById(id);

  if (!module) {
    throw new ApiError(404, "Module not found!!");
  }

  const resourceCount = await Resource.countDocuments({ module: id });
  const assignmentCount = await Assignment.countDocuments({ module: id });

  if (resourceCount > 0 || assignmentCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete: module has ${resourceCount} resource(s) and ${assignmentCount} assignment(s)`,
    );
  }

  await Module.findByIdAndDelete(module._id);

  return res.status(200).json(new ApiResponse(200, null, "Module deleted."));
});

export {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
};
