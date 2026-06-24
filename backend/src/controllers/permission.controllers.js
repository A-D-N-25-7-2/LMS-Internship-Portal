import { Permission } from "../models/permission.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find().sort({ resource: 1, key: 1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, permissions, "Permissions fetched successfully"),
    );
});

export { getAllPermissions };
