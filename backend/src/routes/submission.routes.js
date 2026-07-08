import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  submitAssignment,
  resubmitAssignment,
  getSubmissionsByAssignment,
  getMySubmission,
  gradeSubmission,
  getSubmissionFile,
  deleteSubmission
} from "../controllers/submission.controllers.js";
import { upload } from "../middlewares/upload.middlewares.js";

const router = Router();
router.use(verifyJWT);

router.route("/create/:assignment").post(authorizePermissions("submission:create"), upload.array("files"), submitAssignment);
router
  .route("/update/:id")
  .patch(authorizePermissions("submission:update"), upload.array("files"), resubmitAssignment);
router
  .route("/list/:assignment")
  .get(authorizePermissions("submission:read"), getSubmissionsByAssignment);
router
  .route("/get-my-submission/:assignment")
  .get(getMySubmission);
router
  .route("/grade/:id")
  .patch(authorizePermissions("submission:grade"), gradeSubmission);
router
  .route("/file/:id/:index")
  .get(authorizePermissions("submission:read"), getSubmissionFile);
router.route("/delete/:id").delete(authorizePermissions("submission:delete"), deleteSubmission);

export default router;