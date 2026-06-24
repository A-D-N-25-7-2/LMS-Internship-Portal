import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
} from "../controllers/batch.controllers.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";

const router = Router();

router.use(verifyJWT);
router.route("/create").post(authorizePermissions("batch:create"), createBatch);
router.route("/list").get(authorizePermissions("batch:read"), getAllBatches);
router
  .route("/get-batch/:id")
  .get(authorizePermissions("batch:read"), getBatchById);
router
  .route("/update/:id")
  .patch(authorizePermissions("batch:update"), updateBatch);
router
  .route("/delete/:id")
  .delete(authorizePermissions("batch:delete"), deleteBatch);

export default router;
