import mongoose from "mongoose";

const checkObjectId = (idToCheck) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[idToCheck]))
    return res.status(400).json({ message: "Invalid ID" });
  return next();
};

export default checkObjectId;
