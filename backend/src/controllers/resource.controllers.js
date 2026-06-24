import { Resource } from "../models/resource.models.js";
import { Module } from "../models/module.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addResource = asyncHandler(async (req, res) => {
  const { module } = req.params;
  const { name, description, filePath, text } = req.body;

  const existingModule = await Module.findById(module);

  if (!existingModule) {
    throw new ApiError(404, "Module not found!!");
  }
  if (!name?.trim()) {
    throw new ApiError(400, "Resource name cannot be empty.");
  }

  if (!Array.isArray(filePath)) {
    throw new ApiError(400, "File paths can only be in an array!!");
  }

  if (!text?.trim() && filePath.length == 0) {
    throw new ApiError(400, "Resource cannot be empty!!");
  }

  const createdResource = await Resource.create({
    name: name.trim(),
    description: description.trim(),
    module,
    filePath,
    text: text.trim(),
    uploadedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, createdResource, "Resource created."));
});

const getResourcesByModule = asyncHandler(async (req, res) => {
  const { module } = req.params;

  const existingModule = await Module.findById(module);

  if (!existingModule) {
    throw new ApiError(404, "Module not found!!");
  }

  const resources = await Resource.find({ module });

  return res.status(200).json(new ApiResponse(200, resources, "Resources fetched."));
});
const getResourceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resource = await Resource.findById(id);

  if (!resource) {
    throw new ApiError(404, "Resource not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, resource, "Resource fetched."));
});
const updateResource = asyncHandler(async (req, res) => {
  const { name, description, filePath, text } = req.body;
  const { id } = req.params;

  const resource = await Resource.findById(id);

  if (!resource) {
    throw new ApiError(404, "Resource not found!!");
  }

  if (name != undefined) {
    if (!name.trim()) {
      throw new ApiError(400, "Resource name cannot be empty");
    }
    resource.name = name;
  }

  if (description != undefined) {
    if (!description.trim()) {
      throw new ApiError(400, "Resource description cannot be empty");
    }
    resource.description = description;
  }

  if (text != undefined) {
    if (!text.trim()) {
      throw new ApiError(400, "Resource text cannot be empty");
    }
    resource.text = text;
  }

  if (!Array.isArray(filePath)) {
    throw new ApiError(400, "File paths can only be in an array!!");
  }

  if (!text?.trim() && filePath.length == 0) {
    throw new ApiError(400, "Resource cannot be empty!!");
  }

  resource.filePath = filePath;
  await resource.save();

  return res
    .status(200)
    .json(new ApiResponse(200, resource, "Resource updated."));
});

const removeResource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resource = await Resource.findByIdAndDelete(id);

  if (!resource) {
    throw new ApiError(404, "Resouce not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource deleted successfully."));
});

export {
  addResource,
  getResourcesByModule,
  getResourceById,
  updateResource,
  removeResource,
};
