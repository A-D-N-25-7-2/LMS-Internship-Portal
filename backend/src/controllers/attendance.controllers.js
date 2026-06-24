import { Attendance } from "../models/attendance.models.js";
import { Batch } from "../models/batch.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const markAttendance = asyncHandler(async (req, res) => {
  const { batchId, date, record } = req.body;

  if (!batchId || !date || !Array.isArray(record) || record.length === 0) {
    throw new ApiError(400, "batchId, date, and record are required");
  }

  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  if (isNaN(normalizedDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  const validStatuses = ["present", "absent"];
  for (const entry of record) {
    if (!entry.intern || !entry.status) {
      throw new ApiError(400, "Each record must have intern and status");
    }
    if (!validStatuses.includes(entry.status)) {
      throw new ApiError(
        400,
        `Invalid status: ${entry.status}. Must be one of ${validStatuses.join(", ")}`,
      );
    }
  }

  const existing = await Attendance.findOne({
    batch: batchId,
    date: normalizedDate,
  });
  if (existing) {
    throw new ApiError(
      409,
      "Attendance for this batch on this date has already been marked",
    );
  }

  const attendance = await Attendance.create({
    batch: batchId,
    date: normalizedDate,
    markedBy: req.user._id,
    record,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, attendance, "Attendance marked successfully"));
});

const updateAttendance = asyncHandler(async(req, res) =>{
    const { id } = req.params; 
    const { record } = req.body;

    const attendance = await Attendance.findById(id);

    if(!attendance){
        throw new ApiError("Attendance doesn't exists!!");
    }

    if(!Array.isArray(record) || record.length == 0){
        throw new ApiError ("Record is required!!");
    }

    const validStatuses = ["present", "absent"];
    for (const entry of record) {
      if (!entry.intern || !entry.status) {
        throw new ApiError(400, "Each record must have intern and status");
      }
      if (!validStatuses.includes(entry.status)) {
        throw new ApiError(
          400,
          `Invalid status: ${entry.status}. Must be one of ${validStatuses.join(", ")}`,
        );
      }
    }

    attendance.record = record;
    await attendance.save();

    return res
    .status(200)
    .json(new ApiResponse(200, attendance, "Attendance updated."));
});

const getAttendanceByBatch = asyncHandler(async (req, res) => {
  const { batch } = req.params;

  const batchExists = await Batch.findOne({ batch });

  if (!batchExists) {
    throw new ApiError(404, "Batch not found!!");
  }

  const attendance = await Attendance.find({ batch });

  return res
    .status(200)
    .json(new ApiResponse(200, attendance, "Attendance fetched."));
});

const getMyAttendance = asyncHandler(async(req, res) =>{
     const attendance = await Attendance.aggregate([
       {
         $match: {
           "record.intern": req.user._id,
         },
       },
       {
         $unwind: "$record",
       },
       {
         $match: {
           "record.intern": req.user._id,
         },
       },
       {
         $project: {
           _id: 0,
           batch: 1,
           date: 1,
           status: "$record.status",
         },
       },
       {
         $sort: {
           date: -1,
         },
       },
     ]);

     const totalDays = attendance.length;
     const presentDays = attendance.filter(
       (a) => a.status === "present",
     ).length;

     const percentage =
       totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

     return res.status(200).json(new ApiResponse(200, {attendance, totalDays, presentDays, percentage}, "Attendance fetched."));
});

const getAttendanceByDate = asyncHandler(async(req, res) => {
    const { date } = req.params;

    const attendance = await Attendance.find({ date });

    return res
      .status(200)
      .json(new ApiResponse(200, attendance, "Attendance fetched."));
});

export {
  markAttendance,
  updateAttendance,
  getAttendanceByBatch,
  getMyAttendance,
  getAttendanceByDate,
};
