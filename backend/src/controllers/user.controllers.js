import { User } from "../models/user.models.js";
import { Role } from "../models/role.models.js";
import { Batch } from "../models/batch.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions } from "../constants.js";

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, batch, mentorBatches } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required!!");
  }

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email address!!");
  }

  const fetchRole = await Role.findById({
    _id: role,
  });

  if (!fetchRole) {
    throw new ApiError(404, "This role doesn't exist!!!");
  }

  const createUser = await User.create({
    username,
    email,
    password,
    role,
    batch: batch || undefined,
    mentorBatches: mentorBatches || undefined,
  });

  const user = await User.findById(createUser._id);

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
    .populate("mentorBatches");

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
    .populate("mentorBatches");

  if (!user) {
    throw new ApiError(404, "User not found !!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched!!"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, avatar, role, batch, mentorBatches } = req.body;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  if (username !== undefined) {
    if (!username.trim()) {
      throw new ApiError(400, "Username cannot be empty!!");
    }
    user.username = username.trim();
  }

  if (role !== undefined) {
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      throw new ApiError(400, "Role not found!!");
    }
    user.role = role;
  }

  if (batch !== undefined) {
    const batchExists = await Batch.findById(batch);
    if (!batchExists) {
      throw new ApiError(404, "Batch not found!!!");
    }
    user.batch = batch;
  }

  if (mentorBatches !== undefined) {
    if (!Array.isArray(mentorBatches)) {
      throw new ApiError(400, "Mentor batches should be an array!!");
    }

    user.mentorBatches = mentorBatches;
  }

  await user.save();

  const updatedUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate("role")
    .populate("batch")
    .populate("mentorBatches");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully."));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  await User.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User deleted successfully."));
});

const toggleIsActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  user.isActive = !user.isActive;

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User active status toggled."));
});


export {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleIsActive,
};
