import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
} from "../controllers/module.controllers.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/create")
  .post(authorizePermissions("module:create"), createModule);
router.route("/list").get(authorizePermissions("module:read"), getAllModules);
router
  .route("/get-module/:id")
  .get(authorizePermissions("module:read"), getModuleById);
router
  .route("/update/:id")
  .patch(authorizePermissions("module:update"), updateModule);
router
  .route("/delete/:id")
  .delete(authorizePermissions("module:delete"), deleteModule);

export default router;
