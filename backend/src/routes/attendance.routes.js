import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  heartbeat,
  updateAttendance,
  getMyAttendance,
  getAttendanceByIntern,
  getAttendanceByBatch,
  getAttendanceByDate,
} from "../controllers/attendance.controllers.js";

const router = Router();
router.use(verifyJWT);

router.route("/heartbeat").post(heartbeat);

router.route("/get-mine").get(getMyAttendance);

router
  .route("/:internId/:date")
  .patch(authorizePermissions("attendance:update"), updateAttendance);

router
  .route("/intern/:internId")
  .get(authorizePermissions("attendance:read"), getAttendanceByIntern);

router
  .route("/batch/:batchId")
  .get(authorizePermissions("attendance:read"), getAttendanceByBatch);

router
  .route("/get-by-date")
  .get(authorizePermissions("attendance:read"), getAttendanceByDate);

export default router;