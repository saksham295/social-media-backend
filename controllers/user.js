import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exists" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findOne({ _id: req.params.id });
    if (!userToFollow) {
      return res.status(400).json({ message: "User to follow does not exist" });
    }

    if (userToFollow.followers.includes(req.userId)) {
      return res.status(400).json({
        message: `You already follow ${userToFollow.name}`,
      });
    }

    await userToFollow.updateOne({
      $push: { followers: req.userId },
    });

    await User.findByIdAndUpdate(req.userId, {
      $push: { following: userToFollow._id },
    });

    return res.json({ message: `You started following ${userToFollow.name}` });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findOne({ _id: req.params.id });
    if (!userToUnfollow) {
      return res
        .status(400)
        .json({ message: "User to unfollow does not exist" });
    }

    if (!userToUnfollow.followers.includes(req.userId)) {
      return res.status(400).json({
        message: `You don't follow ${userToUnfollow.name}`,
      });
    }

    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.userId },
    });

    await User.findByIdAndUpdate(req.userId, {
      $pull: { following: userToUnfollow._id },
    });

    return res.json({ message: `You unfollowed ${userToUnfollow.name}` });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId });
    return res.json({
      Name: user.name,
      Followers: user.followers.length,
      Following: user.following.length,
    });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
