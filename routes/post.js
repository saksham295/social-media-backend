import express from "express";
import verifyToken from "../middleware/auth.js";
import {
  addPost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  getPostbyId,
  getUserPosts,
} from "../controllers/post.js";
import checkObjectId from "../middleware/checkObjectId.js";

const router = express.Router();

router.post("/posts", verifyToken, addPost);
router.delete("/posts/:id", verifyToken, checkObjectId("id"), deletePost);
router.post("/like/:id", verifyToken, checkObjectId("id"), likePost);
router.post("/unlike/:id", verifyToken, checkObjectId("id"), unlikePost);
router.post("/comment/:id", verifyToken, checkObjectId("id"), addComment);
router.get("/posts/:id", checkObjectId("id"), getPostbyId);
router.get("/all_posts", verifyToken, getUserPosts);

export default router;
