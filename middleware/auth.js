import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-auth-token"];

  if (!token) {
    return res
      .status(401)
      .json({ message: "A token is required for authentication" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
  return next();
};

export default verifyToken;
