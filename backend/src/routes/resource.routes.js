import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  addResource,
  getResourcesByModule,
  getResourceById,
  updateResource,
  removeResource,
} from "../controllers/resource.controllers.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/create/:module")
  .post(authorizePermissions("resource:create"), addResource);
router
  .route("/list/:module")
  .get(authorizePermissions("resource:read"), getResourcesByModule);
router
  .route("/get-resource/:id")
  .get(authorizePermissions("resource:read"), getResourceById);
router
  .route("/update/:id")
  .patch(authorizePermissions("resource:update"), updateResource);
router
  .route("/delete/:id")
  .delete(authorizePermissions("resource:delete"), removeResource);

export default router;
