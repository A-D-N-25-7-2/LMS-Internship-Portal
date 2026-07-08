import { Router } from "express";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshToken,
  changeCurrentPassword,
  updateAccountDetails,
  removeAvatar,
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/upload.middlewares.js";


const router = Router();


router.route("/login").post( loginUser );
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);
router.route("/update").patch(verifyJWT,upload.single("avatar"), updateAccountDetails);
router.route("/refresh-token").post(refreshToken);
router.route("/remove-avatar").patch(verifyJWT,removeAvatar);

export default router;
