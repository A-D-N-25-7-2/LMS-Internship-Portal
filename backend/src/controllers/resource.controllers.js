import { Resource } from "../models/resource.models.js";
import { Module } from "../models/module.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const addResource = asyncHandler(async (req, res) => {
  const { module } = req.params;
  const { title, description, links } = req.body;

  const existingModule = await Module.findById(module);

  if (!existingModule) {
    throw new ApiError(404, "Module not found!!");
  }
  if (!title?.trim()) {
    throw new ApiError(400, "Resource name cannot be empty.");
  }

  let parsedLinks = [];
  if (links !== undefined) {

    parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
    console.log("parsedLinks:", parsedLinks);
    if (!Array.isArray(parsedLinks)) {
      throw new ApiError(400, "Links can only be in an array!!");
    }
  }

  const uploadedFiles = req.files || [];

  if (uploadedFiles.length === 0 && parsedLinks.length === 0) {
    throw new ApiError(400, "Resource cannot be empty!!");
  }

  const filesData = uploadedFiles.map((file) => ({
    name: file.originalname,
    data: file.buffer,
    contentType: file.mimetype,
  }));

  const createdResource = await Resource.create({
    title: title.trim(),
    description: description?.trim() || "",
    module,
    files: filesData,
    links: parsedLinks,
    uploadedBy: req.user._id,
  });


  const responseData = {
    ...createdResource.toJSON(),
    filesCount: createdResource.files.length,
    linksCount: createdResource.links.length,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Resource created."));
});

const getResourcesByModule = asyncHandler(async (req, res) => {
  const { module } = req.params;

  const existingModule = await Module.findById(module);

  if (!existingModule) {
    throw new ApiError(404, "Module not found!!");
  }

  const resources = await Resource.aggregate([
    { $match: { module: new mongoose.Types.ObjectId(module) } },
    {
      $project: {
        _id: 1,
        title: 1,
        filesCount: { $size: { $ifNull: ["$files", []] } },
        linksCount: { $size: { $ifNull: ["$links", []] } },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, resources, "Resources fetched."));
});
const getResourceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resource = await Resource.findById(id).select("-files.data");

  if (!resource) {
    throw new ApiError(404, "Resource not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, resource, "Resource fetched."));
});
const updateResource = asyncHandler(async (req, res) => {
  const { title, description, links } = req.body;
  const { id } = req.params;

  const resource = await Resource.findById(id);

  if (!resource) {
    throw new ApiError(404, "Resource not found!!");
  }

  if (title !== undefined) {
    if (!title.trim()) {
      throw new ApiError(400, "Resource title cannot be empty");
    }
    resource.title = title.trim();
  }

  if (description !== undefined) {
    resource.description = description.trim();
  }

  if (links !== undefined) {
    const parsedLinks = typeof links === "string" ? JSON.parse(links) : links;
    if (!Array.isArray(parsedLinks)) {
      throw new ApiError(400, "Links can only be in an array!!");
    }
    resource.links = parsedLinks;
  }

  if (req.body.remainingFiles !== undefined) {
    const remaining = typeof req.body.remainingFiles === "string" ? JSON.parse(req.body.remainingFiles) : req.body.remainingFiles;
    if (Array.isArray(remaining)) {
      resource.files = resource.files.filter((f) => remaining.includes(f._id.toString()));
    }
  }

  const uploadedFiles = req.files || [];
  if (uploadedFiles.length > 0) {
    const newFilesData = uploadedFiles.map((file) => ({
      name: file.originalname,
      data: file.buffer,
      contentType: file.mimetype,
    }));
    resource.files.push(...newFilesData); // append, don't overwrite
  }

  if (resource.links.length === 0 && resource.files.length === 0) {
    throw new ApiError(400, "Resource cannot be empty!!");
  }

  await resource.save();

  const responseData = {
    ...resource.toJSON(),
    filesCount: resource.files.length,
    linksCount: resource.links.length,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Resource updated."));
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

const getResourceFile = asyncHandler(async (req, res) => {
  const { id, index } = req.params;

  const resource = await Resource.findById(id);

  if (!resource) {
    throw new ApiError(404, "Resource not found!!");
  }

  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0 || idx >= resource.files.length) {
    throw new ApiError(404, "File not found!!");
  }

  const file = resource.files[idx];

  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(file.name)}"`
  );

  return res.status(200).send(file.data);
});

export {
  addResource,
  getResourcesByModule,
  getResourceById,
  updateResource,
  removeResource,
  getResourceFile,
};
