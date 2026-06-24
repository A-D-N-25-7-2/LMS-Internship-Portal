import { Batch } from "../models/batch.models.js";
import { Program } from "../models/program.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createBatch = asyncHandler(async (req, res) => {
  const { name, description, program, startDate, endDate, status } =
    req.body;

  if (!name.trim()) {
    throw new ApiError(400, "Batch name is required!!");
  }

  if (!program) {
    throw new ApiError(400, "Program is required!!");
  }

  const fetchProgram = await Program.findById(program);

  if (!fetchProgram) {
    throw new ApiError(404, "Program doesn't exist!!");
  }

  if (!startDate) {
    throw new ApiError(400, "Start Date is required!!");
  }

  const allowedStatus = ["upcoming", "ongoing", "completed"];

  if(!allowedStatus.includes(status)){
    throw new ApiError(400, "Invalid status!!!");
  }

  const batch = await Batch.create({
    name: name.trim(),
    program,
    startDate,
    endDate : endDate || null,
    status: status || "upcoming",
  });

  const populatedBatch = await Batch.findById(batch._id)
    .populate("program", "name");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedBatch, "Batch created successfully"));
});

const getAllBatches = asyncHandler(async (req, res) => {
  const batches = await Batch.find().populate("program", "name");

  if (batches.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No batches created."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, batches, "Batches fetched."));
});

const getBatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fetchBatch = await Batch.findById(id)
    .populate("program");

  if (!fetchBatch) {
    throw new ApiError(404, "Batch doesn't exist!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, fetchBatch, "Batch successfully fetched."));
});

const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, program, startDate, endDate, status } = req.body;

  const fetchBatch = await Batch.findById(id)
    .populate("program");

  if (!fetchBatch) {
    throw new ApiError(404, "Batch doesn't exist!!");
  }

  if (name !== undefined) {
    if (!name.trim()) {
      throw new ApiError(400, "Batch name cannot be empty!!");
    }
    fetchBatch.name = name;
  }

  if (program !== undefined) {
    const programExist = await Program.findById(program);
    if (!programExist) {
      throw new ApiError(404, "Program doesn't exist!!!");
    }
    fetchBatch.program = program;
  }

  if (startDate !== undefined) {
    fetchBatch.startDate = startDate;
  }

  if (endDate !== undefined) {
    fetchBatch.endDate = endDate;
  }

  const allowedStatus = ["upcoming", "ongoing", "completed"];
  if (status !== undefined) {
    if (!allowedStatus.includes(status)) {
      throw new ApiError(400, "Invalid status");
    }
    fetchBatch.status = status;
  }

  await fetchBatch.save();

  const updatedBatch = await Batch.findById(fetchBatch._id)
    .populate("program")

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBatch, "Batch updated."));
});

const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fetchBatch = await Batch.findById(id);

  if (!fetchBatch) {
    throw new ApiError(404, "Batch doesn't exist!!");
  }

  await Batch.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Batch successfully deleted."));
});

export { createBatch, getAllBatches, getBatchById, updateBatch, deleteBatch };
