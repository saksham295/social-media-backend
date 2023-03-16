import Post from "../models/Post.js";
import moment from "moment";

export const addPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        message: "Please submit all the required fields.",
      });
    }
    const post = new Post({
      title,
      description,
      postedBy: req.userId,
    });

    await post.save();
    return res.json({
      PostID: post._id,
      Title: post.title,
      Description: post.description,
      "Created Time": moment(post.createdAt).utc().format("hh:mm:ss a"),
    });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }
    if (post.postedBy.toString() === req.userId.toString()) {
      await post.deleteOne();
      return res.json({ message: "Post deleted successfully" });
    } else {
      return res.status(400).json({
        message: "You are not authorized to delete this post",
      });
    }
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }

    if (post.likes.includes(req.userId)) {
      return res.status(400).json({
        message: "Post already liked",
      });
    }

    await post.updateOne({ $push: { likes: req.userId } });
    res.json({ message: "Post liked successfully" });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }

    if (!post.likes.includes(req.userId)) {
      return res.status(400).json({
        message: "Post not liked",
      });
    }

    await post.updateOne({ $pull: { likes: req.userId } });
    return res.json({ message: "Post unliked successfully" });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }

    if (!req.body.comment) {
      return res.status(400).json({ message: "Please add some text" });
    }

    const newComment = {
      comment: req.body.comment,
      postedBy: req.userId,
    };

    post.comments.unshift(newComment);
    await post.save();
    return res.json({ commentID: post.comments[0]._id });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getPostbyId = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }

    return res.json({
      title: post.title,
      description: post.description,
      postedBy: post.postedBy,
      likes: post.likes.length,
      comments: post.comments,
      createdAt: moment(post.createdAt).utc().format("DD/MM/YYYY hh:mm:ss a"),
    });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const myPosts = await Post.find({ postedBy: req.userId }).sort({
      createdAt: -1,
    });

    const posts = [];

    myPosts.map((post) => {
      posts.push({
        id: post._id,
        title: post.title,
        description: post.description,
        likes: post.likes.length,
        comments: post.comments,
        createdAt: moment(post.createdAt).utc().format("DD/MM/YYYY hh:mm:ss a"),
      });
    });

    return res.json({ posts });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
