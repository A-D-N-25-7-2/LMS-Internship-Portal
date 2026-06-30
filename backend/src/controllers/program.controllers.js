import { Program } from "../models/program.models.js";
import { Role } from "../models/role.models.js";
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

  return res
    .status(200)
    .json(new ApiResponse(200, program, "Program created!!"));
});

const getAllPrograms = asyncHandler(async (req, res) => {

  const internRole = await Role.findOne({ name: "Intern" }).select("_id");
  const internId = internRole._id;

    const programs = await Program.aggregate([
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
        }
      },
      {
        $lookup: {
          from: "users",
          let: { programId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$$programId", "$program"] },
                role: internId, // or the actual role ObjectId
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
          interns: 0,
          batches: 0,
          modules: 0,
        },
      },
    ]);

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
    new ApiError(404, "Program not found!!");
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
      new ApiError(404, "Program not found!!");
    }

    if(!name.trim()){
        new ApiError(400, "Program name cannot be empty!!");
    }
    fetchProgram.name = name.trim();

    fetchProgram.description = description || fetchProgram.description;
    await fetchProgram.save();

    return res
    .status(200)
    .json(new ApiResponse(200, fetchProgram, "Program updated successfully."));
});

const deleteProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fetchProgram = await Program.findById(id);

    if (!fetchProgram) {
      new ApiError(404, "Program not found!!");
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
