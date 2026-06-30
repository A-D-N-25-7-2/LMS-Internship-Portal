import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import {
  createProgram,
  getAllPrograms,
  getAllProgramsNames,
  getProgramById,
  updateProgram,
  deleteProgram,
} from "../controllers/program.controllers.js";
import { Program } from "../models/program.models.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/create")
  .post(authorizePermissions("program:create"), createProgram);

router.route("/list").get(authorizePermissions("program:read"), getAllPrograms);
router.route("/list-names").get(getAllProgramsNames);

router
  .route("/get-program/:id")
  .get( getProgramById);

router
  .route("/update/:id")
  .patch(authorizePermissions("program:update"), updateProgram);

router
  .route("/delete/:id")
  .delete(authorizePermissions("program:delete"), deleteProgram);

export default router;
