import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import { getAllPermissions } from "../controllers/permission.controllers.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(authorizePermissions("role:read"), getAllPermissions);

export default router;
