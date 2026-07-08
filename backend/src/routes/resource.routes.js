import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  addResource,
  getResourcesByModule,
  getResourceById,
  updateResource,
  removeResource,
  getResourceFile,
} from "../controllers/resource.controllers.js";
import { upload } from "../middlewares/upload.middlewares.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/create/:module")
  .post(authorizePermissions("resource:create"), upload.array("files"), addResource);
router
  .route("/list/:module")
  .get(authorizePermissions("resource:read"), getResourcesByModule);
router
  .route("/get-resource/:id")
  .get(authorizePermissions("resource:read"), getResourceById);
router
  .route("/file/:id/:index")
  .get(authorizePermissions("resource:read"), getResourceFile);
router
  .route("/update/:id")
  .patch(authorizePermissions("resource:update"), upload.array("files"), updateResource);
router
  .route("/delete/:id")
  .delete(authorizePermissions("resource:delete"), removeResource);

export default router;
