import { Program } from "../models/program.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Role } from "../models/role.models.js";
import { Batch } from "../models/batch.models.js";

const getRoleId = async (roleName) => {
  const role = await Role.findOne({
    name: { $regex: `^${roleName}$`, $options: "i" },
  }).select("_id");
  return role._id;
};

const getDashboardData = asyncHandler(async (req, res) => {
  const totalPrograms = await Program.countDocuments();
  const totalBatches = await Batch.countDocuments();
  const totalActiveInterns = await User.countDocuments({
    role: await getRoleId("Intern"),
    isActive: true,
  });
  const totalMentors = await User.countDocuments({
    role: await getRoleId("Mentor"),
    isActive: true,
  });

  const recentBatches = await Batch.find().sort({ createdAt: -1 }).limit(5).populate("program", "name");

  const dashboardData = {
    totalPrograms,
    totalBatches,
    totalActiveInterns,
    totalMentors,
    recentBatches,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dashboardData,
        "Dashboard data fetched successfully",
      ),
    );
});

const getInternDashboardData = asyncHandler(async (req, res) => {
  const batch = await Batch.findOne({ _id: req.user?.batch }).populate(
    "program",
    "name",
  );

  let programs = [];
  if (!batch) {
    programs = await Program.find({
      _id: { $in: req.user?.program },
    }).select("name");
  }

  const internDashboardData = {
    program: programs.length === 0 ? batch.program : programs,
    batch: batch ? batch : null,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        internDashboardData,
        "Intern dashboard data fetched successfully",
      ),
    );
});

const getMentorDashboardData = asyncHandler(async (req, res) => {
  const mentorBatches = await Batch.find({
    _id: { $in: req.user?.mentorBatches },
  }).select("name _id");
  const mentorBatchesCount = mentorBatches.length;
  const totalActiveInterns = await User.countDocuments({
    role: await getRoleId("Intern"),
    batch: { $in: req.user?.mentorBatches },
    status: "active",
  });

  const mentorDashboardData = {
    mentorBatches,
    mentorBatchesCount,
    totalActiveInterns,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        mentorDashboardData,
        "Mentor dashboard data fetched successfully",
      ),
    );
});
export { getDashboardData, getInternDashboardData, getMentorDashboardData , getRoleId};
