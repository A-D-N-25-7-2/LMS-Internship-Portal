import { Program } from "../models/program.models.js";
import { Role } from "../models/role.models.js";
import { Batch } from "../models/batch.models.js";
import { User } from "../models/user.models.js";
import { Module } from "../models/module.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createProgram = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name.trim()) {
    throw new ApiError(400, "Prpgram name cannot be empty!!!");
  }

  const existingProgram = await Program.findOne({ name: name.trim() });
  if (existingProgram) {
    throw new ApiError(400, "Program with this name already exists!!");
  }

  const program = await Program.create({
    name: name.trim(),
    description: description.trim() || null,
  });

  const response = {
    ...program.toJSON(),
    batchCount: 0,
    moduleCount: 0,
    internCount: 0,
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Program created!!"));
});

const getAllPrograms = asyncHandler(async (req, res) => {
  const internRole = await Role.findOne({ name: "Intern" }).select("_id");
  const mentorRole = await Role.findOne({ name: "Mentor" }).select("_id");
  const internId = internRole._id;
  const mentorId = mentorRole._id;

  const isInternOrMentor =
    req.user.role.toString() === internId.toString() ||
    req.user.role.toString() === mentorId.toString();

  const pipeline = [
    ...(isInternOrMentor
      ? [{ $match: { _id: { $in: req.user.program } } }]
      : []),
    {
      $lookup: {
        from: "batches",
        localField: "_id",
        foreignField: "program",
        as: "batches",
      },
    },
    {
      $lookup: {
        from: "modules",
        localField: "_id",
        foreignField: "program",
        as: "modules",
      },
    },
    {
      $lookup: {
        from: "users",
        let: { programId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$$programId", "$program"] },
              role: internId,
            },
          },
        ],
        as: "interns",
      },
    },
    {
      $addFields: {
        internCount: { $size: "$interns" },
        batchCount: { $size: "$batches" },
        moduleCount: { $size: "$modules" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        internCount: 1,
        batchCount: 1,
        moduleCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const programs = await Program.aggregate(pipeline);

  return res
    .status(200)
    .json(new ApiResponse(200, programs, "Programs fetched."));
});

const getAllProgramsNames = asyncHandler(async (req, res) => {
  
  const programs = await Program.find().select("name _id");

  return res
    .status(200)
    .json(new ApiResponse(200, programs, "Programs fetched."));
});

const getProgramById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fetchProgram = await Program.findById(id);

  if (!fetchProgram) {
    throw new ApiError(404, "Program not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, fetchProgram, "Program fetched successfully."));
});

const updateProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {name, description} = req.body;

    const fetchProgram = await Program.findById(id);

    if (!fetchProgram) {
      throw new ApiError(404, "Program not found!!");
    }

    if(!name.trim()){
        throw new ApiError(400, "Program name cannot be empty!!");
    }
    fetchProgram.name = name.trim();

    fetchProgram.description = description || fetchProgram.description;
    await fetchProgram.save();
    const internRole = await Role.findOne({ name: "Intern" }).select("_id");
    const internId = internRole._id;
    
    const internCount = await User.countDocuments({ program: fetchProgram._id, role: internId });
    const batchCount = await Batch.countDocuments({ program: fetchProgram._id });
    const moduleCount = await Module.countDocuments({ program: fetchProgram._id });

    const responseData = {
      ...fetchProgram.toJSON(),
      internCount,
      batchCount,
      moduleCount,
    };
    return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Program updated successfully."));
});

const deleteProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fetchProgram = await Program.findById(id);

    if (!fetchProgram) {
      throw new ApiError(404, "Program not found!!");
    }

    const associatedBatches = await Batch.find({ program: fetchProgram._id });
    if (associatedBatches.length > 0) {
      throw new ApiError(400, "Cannot delete program with associated batches!!");
    }

    const associatedUsers = await User.find({ program: fetchProgram._id });
    if (associatedUsers.length > 0) {
      throw new ApiError(400, "Cannot delete program with associated users!!");
    }

    const associatedModules = await Module.find({ program: fetchProgram._id });
    if (associatedModules.length > 0) {
      throw new ApiError(400, "Cannot delete program with associated modules!!");
    }

    await Program.findByIdAndDelete(fetchProgram._id);

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Program deleted."));
});

export {
  createProgram,
  getAllPrograms,
  getAllProgramsNames,
  getProgramById,
  updateProgram,
  deleteProgram,
};
