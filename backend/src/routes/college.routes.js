import { Router } from "express";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createCollege,
    updateCollege,
    deleteCollege,
    getAllColleges,
    getCollegeById
} from "../controllers/college.controllers.js";

const router = Router();

router.use(verifyJWT);
router.route("/create").post(authorizePermissions("college:create"), createCollege);
router.route("/update/:id").patch(authorizePermissions("college:update"), updateCollege);
router.route("/delete/:id").delete(authorizePermissions("college:delete"), deleteCollege);
router.route("/list").get(authorizePermissions("college:read"), getAllColleges);
router.route("/get/:id").get(authorizePermissions("college:read"), getCollegeById);

export default router;