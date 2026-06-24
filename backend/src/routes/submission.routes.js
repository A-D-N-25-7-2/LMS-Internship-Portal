import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  submitAssignment,
  resubmitAssignment,
  getSubmissionsByAssignment,
  getSubmissionByAssignment,
  getSubmissionById,
  gradeSubmission,
} from "../controllers/submission.controllers.js";

const router = Router();
router.use(verifyJWT);

router.route("/create/:assignment").post(authorizePermissions("submission:create"), submitAssignment);
router
  .route("/update/:id")
  .patch(authorizePermissions("submission:update"), resubmitAssignment);
router
  .route("/list/:assignment")
  .get(authorizePermissions("submission:read"), getSubmissionsByAssignment);
router
  .route("/get-by-assignment")
  .get(authorizePermissions("submission:read"), getSubmissionByAssignment);
router
  .route("/get-assignment")
  .get(authorizePermissions("submission:get"), getSubmissionById);
router
  .route("/grade")
  .patch(authorizePermissions("submission:grade"), gradeSubmission);

export default router;