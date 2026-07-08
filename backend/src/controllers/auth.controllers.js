import fs from "fs";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cookieOptions } from "../constants.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating tokens!!");
  }
};

const getCurrentUser = asyncHandler(async (req, res) => {
   const user = await User.findById(req.user._id)
     .select("-password -refreshToken")
     .populate({
       path: "role",
       populate: {
         path: "permissions",
         select: "key",
       },
     })
     .populate("batch", "name program")
     .populate("mentorBatches", "name")
     .populate("program", "name");

   if (!user) {
     throw new ApiError(404, "User not found!!");
   }

   const permissions = user.role?.permissions?.map((p) => p.key) || [];

   return res
     .status(200)
     .json(new ApiResponse(200, { user, permissions }, "User fetched"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email.trim()) {
    throw new ApiError(400, "Email cannot be empty!!");
  }

  if (!password.trim()) {
    throw new ApiError(400, "Password cannot be empty!!");
  }

  const user = await User.findOne({
    email: email?.toLowerCase(),
  })
    .populate({
      path: "role",
      select: "permissions name isSystemRole",
      populate: {
        path: "permissions",
        select: "key -_id",
      },
    })
    .populate("mentorBatches")
    .populate("batch", "name program");

  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid password");
  }

  if (user.refreshToken) {
    try {
      jwt.verify(user.refreshToken, process.env.REFRESH_TOKEN_SECRET);
      throw new ApiError(400, "Account has been already logged in on an another device");
    } catch (err) {
      if (err.statusCode === 400) {
        throw err;
      }
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User logged in successfully.",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return res
    .status(200)
    .clearCookie("accessToken", { ...cookieOptions, maxAge: 0 })
    .clearCookie("refreshToken", { ...cookieOptions, maxAge: 0 })
    .json(new ApiResponse(200, "User logged out successfully.", null));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username?.trim()) {
    throw new ApiError(400, "username is required!!");
  }

  const user = await User.findById(req.user._id);

  user.username = username;

  if(req.file) {
    user.avatar = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {username: user.username, avatar: user.avatar }, "Account details updated successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword?.trim() || !newPassword?.trim()) {
    throw new ApiError(400, "Old password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword; // pre-save hook hashes this automatically
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    console.log("No refresh token provided");
    throw new ApiError(401, "Unauthorized: No refresh token provided");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      console.log("User not found for the provided refresh token");
      throw new ApiError(401, "Unauthorized: Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      console.log("Refresh token mismatch");
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24,
      })
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) throw error; // ✅ let your own errors pass through
    throw new ApiError(500, error?.message || "Error refreshing access token");
  }
});

const removeAvatar = asyncHandler(async(req, res) => {
  const user = await User.findById(req.user._id);

  if(!user){
    throw new ApiError(404, "User not found");
  }

  if(!user.avatar || !user.avatar.data){
    throw new ApiError(400, "User already has the default avatar!!");
  }
  
  user.avatar = {
    data: null,
    contentType: null
  };
  await user.save();

  return res
  .status(200)
  .json(new ApiResponse(200, null, "User custom avatar removed."));
});

export {
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshToken,
  changeCurrentPassword,
  updateAccountDetails,
  removeAvatar,
};
