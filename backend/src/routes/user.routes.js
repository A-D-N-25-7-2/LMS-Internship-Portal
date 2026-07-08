import { Router } from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleIsActive,
  getAllInternsByBatch,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";

const router = Router();

router.use(verifyJWT);

router.route("/create").post(authorizePermissions("user:create"), createUser);
router.route("/list").get(authorizePermissions("user:read"), getAllUsers);
router
  .route("/get-user/:id")
  .get(authorizePermissions("user:read"), getUserById);
router
  .route("/update/:id")
  .patch(authorizePermissions("user:update"), updateUser);
router
  .route("/toggle-active-status/:id")
  .patch(authorizePermissions("user:update"), toggleIsActive);
router
  .route("/delete/:id")
  .delete(authorizePermissions("user:delete"), deleteUser);
router.route("/list-interns/:batchId").get(authorizePermissions("batch:read"), getAllInternsByBatch);

export default router;
