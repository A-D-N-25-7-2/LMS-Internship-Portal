import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions} from "../middlewares/authorizePermissions.middlewares.js";
import {
  markAttendance,
  updateAttendance,
  getAttendanceByBatch,
  getMyAttendance,
  getAttendanceByDate,
} from "../controllers/attendance.controllers.js";

const router = Router();
router.use(verifyJWT);
router
  .route("/create")
  .post(authorizePermissions("attendance:create"), markAttendance);
router
  .route("/update")
  .patch(authorizePermissions("attendance:update"), updateAttendance);
router
  .route("/get-by-attendance")
  .get(authorizePermissions("attendance:read"), getAttendanceByBatch);
router
  .route("/get-mine")
  .get(authorizePermissions("attendance:read"), getMyAttendance);
router
  .route("/get-by-date")
  .get(authorizePermissions("attendance:read"), getAttendanceByDate);

export default router;