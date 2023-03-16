import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from "./routes/user.js";
import postRoutes from "./routes/post.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", userRoutes);
app.use("/api", postRoutes);

const { API_PORT } = process.env;
const port = API_PORT || 3000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

export default app;
