import { ApiError } from "../utils/ApiError.js";
import {  Role } from "../models/role.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authorizePermissions = (...requiredPermissions) => {
  return asyncHandler( async (req , res, next) => {
    if(!req.user){
      throw new ApiError(401, "Unauthorized user!!");
    }

    const role = await Role.findById(req.user.role).populate('permissions');

    if(!role){
      throw new ApiError(403, "No role assigned!!");
    }

    const userPermissions = role.permissions.map((p)=> p.key);

    const hasPermission = requiredPermissions.every((perm) => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    }

    next();
  })
  };
