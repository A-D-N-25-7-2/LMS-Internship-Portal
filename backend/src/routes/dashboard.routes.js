import { Router } from "express";
import { getDashboardData, getInternDashboardData, getMentorDashboardData } from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", verifyJWT, getDashboardData);
router.get("/intern", verifyJWT, getInternDashboardData);
router.get("/mentor", verifyJWT, getMentorDashboardData);

export default router;