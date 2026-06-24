import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/role.controllers.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";

const router = Router();
router.use(verifyJWT);

router.route("/create").post(authorizePermissions("role:create"), createRole);
router.route("/list").get(authorizePermissions("role:read"), getAllRoles);
router
  .route("/get-role/:id")
  .get(authorizePermissions("role:read"), getRoleById);
router
  .route("/update/:id")
  .patch(authorizePermissions("role:update"), updateRole);
router
  .route("/delete/:id")
  .delete(authorizePermissions("role:delete"), deleteRole);

export default router;
