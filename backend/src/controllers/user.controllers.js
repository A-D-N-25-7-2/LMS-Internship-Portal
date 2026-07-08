import { User } from "../models/user.models.js";
import { Role } from "../models/role.models.js";
import { Batch } from "../models/batch.models.js";
import { Submission } from "../models/submission.models.js";
import { Attendance } from "../models/attendance.models.js";
import { Program } from "../models/program.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { College } from "../models/college.models.js";

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, batch, mentorBatches, college } = req.body;
  let { program } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!!");
  }

  const existingUser = await User.findOne({
    email,
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email address!!");
  }

  if (college && college !== "" && college !== "None") {
    const existingCollege = await College.findById(college);
    if (!existingCollege) {
      throw new ApiError(404, "College not found!!");
    }
  }


  const roleExists = await Role.findById({
    _id: role,
  });

  if (!roleExists) {
    throw new ApiError(404, "This role doesn't exist!!!");
  }

  if (batch !== "" && batch !== null) {
    const existingBatch = await Batch.findById(batch);
    if (!existingBatch) {
      throw new ApiError(404, "Batch not found!!");
    }
    program = [existingBatch.program];
  }

  if (!Array.isArray(program)) {
    throw new ApiError(400, "Program must be an array!!");
  }

  const validProgramsCount = await Program.countDocuments({
    _id: { $in: program },
  });

  if (validProgramsCount !== program.length) {
    throw new ApiError(400, "There are one or more invalid programs!!");
  }

  if (mentorBatches !== undefined && roleExists.name === "Mentor") {
    if (!Array.isArray(mentorBatches)) {
      throw new ApiError(400, "Mentor batches should be an array!!");
    }
    const validBatches = await Batch.find({ _id: { $in: mentorBatches } });
    if (validBatches.length !== mentorBatches.length) {
      throw new ApiError(400, "One or more batch IDs are invalid!!");
    }

    const batches = await Batch.find({ _id: { $in: mentorBatches } }).select(
      "program",
    );

    program = [...new Set(batches.map((b) => b.program.toString()))];
  }

  const createUser = await User.create({
    username,
    email,
    password,
    role,
    program,
    batch: batch || undefined,
    mentorBatches: mentorBatches || undefined,
    college: college || undefined,
  });

  const user = await User.findById(createUser._id).populate("batch","name").populate("role","name").populate("college", "name");

  if (!user) {
    throw new ApiError(500, "Error while creating user.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User successfully created."));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -refreshToken")
    .populate("role")
    .populate("batch")
    .sort({isActive: -1})

  if (!users) {
    return res.status(200).json(new ApiResponse(200, "No users exist!", null));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched succesfully."));
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select("-password -refreshToken")
    .populate("role")
    .populate("batch")
    .populate("mentorBatches")
    .populate("program")
    .populate("college");

  if (!user) {
    throw new ApiError(404, "User not found !!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched!!"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, avatar, role, email, program, batch, mentorBatches, college } = req.body;

  const user = await User.findById(id).populate("role", "name isSystemRole");

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }
  if(user.role.isSystemRole){
    const userRole = await Role.findById(req.user.role);
    if (userRole.name !== "Super Admin") {
      throw new ApiError(
        400,
        "This user cannot be updated as he/she is having a SystemRole.",
      );
    }
  }

  if (username !== undefined) {
    if (!username.trim()) {
      throw new ApiError(400, "Username cannot be empty!!");
    }
    user.username = username.trim();
  }

  if (role !== undefined) {
    const newRole = await Role.findById(role);
    if (!newRole) {
      throw new ApiError(400, "Role not found!!");
    }
    user.role = role;
  }

  if(email !== undefined){
    if (!email.trim()) {
      throw new ApiError(400, "Email cannot be empty!!");
    }
    user.email = email.trim();
  }

  const roleExists = await Role.findById(user.role);

  if (!roleExists) {
    throw new ApiError(400, "User has no valid role assigned!!");
  }
  if (college !== undefined && college !== "" && college !== "None" && college !== null) {
    const existingCollege = await College.findById(college);
    if (!existingCollege) {
      throw new ApiError(404, "College not found!!");
    }
  }

  if (roleExists.name === "Intern") {
    if (batch !== undefined) {
      if (batch !== "" && batch !== "None" && batch !== null) {
        const batchExists = await Batch.findById(batch);
        if (!batchExists) {
          throw new ApiError(404, "Batch not found!!!");
        }
        user.batch = batch;
        user.program = [batchExists.program];
      } else {
        user.batch = null;
        user.program = program;
      }
    }
    if (college !== undefined) {
      user.college = (college === "" || college === "None" || college === null) ? null : college;
    }
  }

  if (mentorBatches !== undefined && roleExists.name === "Mentor") {
    if (!Array.isArray(mentorBatches)) {
      throw new ApiError(400, "Mentor batches should be an array!!");
    }
    const validBatches = await Batch.find({ _id: { $in: mentorBatches } });
    if (validBatches.length !== mentorBatches.length) {
      throw new ApiError(400, "One or more batch IDs are invalid!!");
    }
    user.mentorBatches = mentorBatches;
    user.batch = null;
    user.college = null;
    const batches = await Batch.find({ _id: { $in: mentorBatches } }).select(
      "program",
    );

   const programs = [...new Set(batches.map((b) => b.program.toString()))];
    user.program = programs;
  }

  if(roleExists.name !== "Mentor"){
    user.mentorBatches = [];
  }

  if(roleExists.name !== "Intern" && roleExists.name !== "Mentor"){
    user.program = [];
    user.college = null;
  }
  await user.save();

  const updatedUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate("role")
    .populate("batch")
    .populate("college");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully."));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("role", "name isSystemRole");

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  if (user.role.isSystemRole) {
    const userRole = await Role.findById(req.user.role);
    if(userRole.name !== "Super Admin"){
    throw new ApiError(
      400,
      "This user cannot be deleted as he/she is having a SystemRole.",
    );
  }
  }

  await Submission.deleteMany({ intern: user._id });
  await Attendance.deleteMany({ intern: user._id });
  await User.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User deleted successfully."));
});

const toggleIsActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("role", "name isSystemRole");

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  if (user.role.isSystemRole) {
    const userRole = await Role.findById(req.user.role);
    if (userRole.name !== "Super Admin") {
      throw new ApiError(
        400,
        "This user cannot be deleted as he/she is having a SystemRole.",
      );
    }
  }

  user.isActive = !user.isActive;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User active status toggled."));
});

const getAllInternsByBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params; 

  const batch = await Batch.findById(batchId);
  if (!batch) {
    throw new ApiError(404, "Batch not found!!");
  }

  const interns = await User.find({ batch: batchId }).select("username email isActive");

  return res
    .status(200)
    .json(new ApiResponse(200, interns, "Interns fetched successfully."));
});

export {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleIsActive,
  getAllInternsByBatch,
};
