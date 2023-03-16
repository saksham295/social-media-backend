import express from "express";
import verifyToken from "../middleware/auth.js";
import {
  login,
  followUser,
  unfollowUser,
  getUser,
} from "../controllers/user.js";
import checkObjectId from "../middleware/checkObjectId.js";

const router = express.Router();

router.post("/authenticate", login);
router.post("/follow/:id", verifyToken, checkObjectId("id"), followUser);
router.post("/unfollow/:id", verifyToken, checkObjectId("id"), unfollowUser);
router.get("/user", verifyToken, getUser);

export default router;
