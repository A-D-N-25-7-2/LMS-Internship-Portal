import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions} from "../middlewares/authorizePermissions.middlewares.js";
import {
  createAssignment,
  getAssignmentsByModule,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignment.controllers.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/create/:module")
  .post(authorizePermissions("assignment:create"), createAssignment);
router.route("/list/:module").get(authorizePermissions("assignment:read"), getAssignmentsByModule);
router
  .route("/get-assignment/:id")
  .get(authorizePermissions("assignment:read"), getAssignmentById);
router
  .route("/update/:id")
  .patch(authorizePermissions("assignment:update"), updateAssignment);
router
  .route("/delete/:id")
  .delete(authorizePermissions("assignment:delete"), deleteAssignment);

export default router;