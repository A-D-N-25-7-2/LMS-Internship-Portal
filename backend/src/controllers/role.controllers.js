import { Role } from "../models/role.models.js";
import { User } from "../models/user.models.js";
import { Permission } from "../models/permission.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Role name cannot be empty!!");
  }

  if (!Array.isArray(permissions) || permissions.length == 0) {
    throw new ApiError(400, "At least one permission must be assigned");
  }

  const existingRole = await Role.findOne({ name: name.trim() });
  if (existingRole) {
    throw new ApiError(409, "Role with this name already exists!!");
  }

  const validPermissions = await Permission.find({ _id: { $in: permissions } });
  if (validPermissions.length !== permissions.length) {
    throw new ApiError(400, "One or more permissions are invalid!!");
  }

  const role = await Role.create({
    name: name.trim(),
    description,
    permissions,
  });

  const fetchedRole = await Role.findById(role._id).populate("permissions");

  return res
    .status(200)
    .json(new ApiResponse(200, fetchedRole, "Role created successfully."));
});

const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().populate("permissions");

  return res
    .status(200)
    .json(new ApiResponse(200, roles, "Roles fetched successfully."));
});

const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findById(id).populate("permissions");

  if (!role) {
    throw new ApiError(404, "Role not found!!");
  }

  return res.status(200).json(new ApiResponse(200, role, "Role fetched successfully."));
});

const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, permissions, description } = req.body;

  const role = await Role.findById(id);

  if (!role) {
    throw new ApiError(404, "Role not found!!");
  }

  if (role.isSystemRole) {
    throw new ApiError(403, "System Role cannot be updated!!");
  }

  if (name !== undefined) {
    if (!name.trim()) {
      throw new ApiError(400, "Role name cannot be empty!!");
    }

    const duplicateName = await Role.findOne({
      name: name.trim(),
      _id: { $ne: id },
    });

    if (duplicateName) {
      throw new ApiError(409, "Another role with this name already exists!!");
    }

    role.name = name.trim();
  }

  if (description !== undefined) {
    role.description = description.trim();
  }

  if (permissions) {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new ApiError(400, "At least one permission must be assigned");
    }

    const validPermissions = await Permission.find({
      _id: { $in: permissions },
    });

    if (validPermissions.length !== permissions.length) {
      throw new ApiError(400, "One or more permission IDs are invalid");
    }

    role.permissions = permissions;
  }

  await role.save();

  const updatedRole = await Role.findById(role._id).populate("permissions");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedRole, "Role updated successfully"));
});

const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findById(id).populate("permissions");

  if (!role) {
    throw new ApiError(404, "Role not found!!");
  }

  if (role.isSystemRole) {
    throw new ApiError(403, "System Role cannot be deleted!!");
  }

  const usersWithRole = await User.countDocuments({ role: id });
  if (usersWithRole > 0) {
    throw new ApiError(
      409,
      `Cannot delete role: ${usersWithRole} user(s) are currently assigned this role`,
    );
  }

  await Role.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Role deleted successfully."));
});

export { createRole, getAllRoles, getRoleById, updateRole, deleteRole };
