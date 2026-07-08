import { Attendance } from "../models/attendance.models.js";
import { User } from "../models/user.models.js"; // adjust path/name if different
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const HEARTBEAT_MAX_GAP_SEC = 45;
const THRESHOLD_SEC =  60 * 15;

const getTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const parseDateParam = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  if (isNaN(d.getTime())) return null;
  return d;
};

const heartbeat = asyncHandler(async (req, res) => {
  const internId = req.user._id;
  const today = getTodayUTC();
  const now = new Date();

  let record = await Attendance.findOne({ intern: internId, date: today });

  if (!record) {
    record = await Attendance.create({
      intern: internId,
      batch: req.user.batch || null,
      date: today,
      status: "absent",
      activeSeconds: 0,
      lastHeartbeatAt: now,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { status: record.status, activeSeconds: 0 },
        "Heartbeat recorded.",
      ),
    );
  }

  // A permission-holder already manually set this record for today — don't
  // let a stray/late heartbeat silently overwrite a human decision.
  if (record.updatedBy) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { status: record.status, activeSeconds: Math.round(record.activeSeconds) },
        "Manually set — heartbeat ignored.",
      ),
    );
  }

  const gapSec = record.lastHeartbeatAt
    ? (now - record.lastHeartbeatAt) / 1000
    : 0;
  const safeGap = Math.max(0, Math.min(gapSec, HEARTBEAT_MAX_GAP_SEC));

  record.activeSeconds += safeGap;
  record.lastHeartbeatAt = now;

  if (record.activeSeconds >= THRESHOLD_SEC && record.status !== "present") {
    record.status = "present";
    record.markedAt = now;
  }

  await record.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { status: record.status, activeSeconds: Math.round(record.activeSeconds) },
      "Heartbeat recorded.",
    ),
  );
});

// ---------------------------------------------------------------------------
// PATCH /attendance/:internId/:date  (permission holder only, e.g. "attendance:update")
// Manual override for a single intern on a single day — corrects a broken
// heartbeat session, backdates an excused absence, etc. Locks the record
// against further auto-heartbeat mutation for that day.
// ---------------------------------------------------------------------------
const updateAttendance = asyncHandler(async (req, res) => {
  const { internId, date } = req.params;
  const { status } = req.body;

  const validStatuses = ["present", "absent"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status: ${status}. Must be one of ${validStatuses.join(", ")}`,
    );
  }

  const normalizedDate = parseDateParam(date);
  if (!normalizedDate) {
    throw new ApiError(400, "Invalid date format");
  }

  const internExists = await User.findById(internId);
  if (!internExists) {
    throw new ApiError(404, "Intern not found");
  }

  const record = await Attendance.findOneAndUpdate(
    { intern: internId, date: normalizedDate },
    {
      $set: {
        status,
        updatedBy: req.user._id,
        markedAt: status === "present" ? new Date() : undefined,
      },
      $setOnInsert: {
        intern: internId,
        date: normalizedDate,
        batch: internExists.batch || null,
      },
    },
    { new: true, upsert: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, record, "Attendance updated."));
});

// ---------------------------------------------------------------------------
// GET /attendance/get-mine  (intern, self)
// Own attendance history + summary stats.
// ---------------------------------------------------------------------------
const getMyAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({ intern: req.user._id })
    .sort({ date: -1 })
    .select("date status activeSeconds markedAt");

  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const percentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      { attendance, totalDays, presentDays, percentage },
      "Attendance fetched.",
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /attendance/intern/:internId  (permission holder)
// Any single intern's full history + stats — for mentor/admin lookup.
// ---------------------------------------------------------------------------
const getAttendanceByIntern = asyncHandler(async (req, res) => {
  const { internId } = req.params;

  const internExists = await User.findById(internId);
  if (!internExists) {
    throw new ApiError(404, "Intern not found");
  }

  const attendance = await Attendance.find({ intern: internId })
    .sort({ date: -1 })
    .select("date status activeSeconds markedAt updatedBy");

  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const percentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      { attendance, totalDays, presentDays, percentage },
      "Attendance fetched.",
    ),
  );
});

// ---------------------------------------------------------------------------
// GET /attendance/batch/:batchId?date=YYYY-MM-DD  (permission holder)
// All interns in a batch for a given date (defaults to today) — the
// replacement for the old "one document per batch" view, now built as an
// aggregation over intern-centric documents.
// ---------------------------------------------------------------------------
const getAttendanceByBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const dateStr = req.query.date;

  const targetDate = dateStr ? parseDateParam(dateStr) : getTodayUTC();
  if (!targetDate) {
    throw new ApiError(400, "Invalid date format");
  }

  const attendance = await Attendance.find({
    batch: batchId,
    date: targetDate,
  })
    .populate("intern", "username email")
    .select("intern status activeSeconds markedAt updatedBy");

  return res
    .status(200)
    .json(new ApiResponse(200, attendance, "Attendance fetched."));
});

// ---------------------------------------------------------------------------
// GET /attendance/get-by-date?date=YYYY-MM-DD  (permission holder)
// Every intern, batched or not, for a single day — the org-wide daily view.
// ---------------------------------------------------------------------------
const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const targetDate = parseDateParam(date);
  if (!targetDate) {
    throw new ApiError(400, "Invalid date format");
  }

  const attendance = await Attendance.find({ date: targetDate })
    .populate("intern", "username email")
    .select("intern batch status activeSeconds markedAt updatedBy");

  const totalInterns = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "present").length;

  return res.status(200).json(
    new ApiResponse(
      200,
      { attendance, totalInterns, presentCount },
      "Attendance fetched.",
    ),
  );
});

export {
  heartbeat,
  updateAttendance,
  getMyAttendance,
  getAttendanceByIntern,
  getAttendanceByBatch,
  getAttendanceByDate,
};