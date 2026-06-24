import { Router } from "express";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshToken,
  changeCurrentPassword,
  updateAccountDetails,
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/upload.middlewares.js";
import { authorizePermissions } from "../middlewares/authorizePermissions.middlewares.js";

const router = Router();


router.route("/login").post( loginUser );
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);
router.route("/update").patch(verifyJWT,upload.single("avatar"), updateAccountDetails);
router.route("/refresh-token").post(refreshToken);

export default router;
