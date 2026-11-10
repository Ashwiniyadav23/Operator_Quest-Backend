import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import questionRoutes from "./routes/questionRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Operator Quest API" }));
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/tutor", tutorRoutes);

const PORT = process.env.PORT || 5001;
try {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Create server/.env from server/.env.example and set it.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
}
