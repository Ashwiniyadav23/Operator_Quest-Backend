import express from "express";
import Progress from "../models/Progress.js";
import { CATEGORIES } from "../config/categories.js";

const router = express.Router();

router.get("/:studentId", async (req, res) => {
  try {
    const progress = await Progress.findOne({ studentId: req.params.studentId });
    res.json(progress || { studentId: req.params.studentId, totalXp: 0, categories: {} });
  } catch {
    res.status(500).json({ message: "Could not load progress." });
  }
});

router.post("/answer", async (req, res) => {
  try {
    const { studentId, category, isCorrect, completed } = req.body;
    if (!studentId || !CATEGORIES[category] || typeof isCorrect !== "boolean") {
      return res.status(400).json({ message: "studentId, valid category and isCorrect are required." });
    }
    const progress = await Progress.findOneAndUpdate(
      { studentId },
      { $setOnInsert: { studentId } },
      { new: true, upsert: true }
    );
    const item = progress.categories.get ? progress.categories.get(category) : progress.categories[category];
    item.attempted += 1;
    if (isCorrect) { item.correct += 1; item.xp += 10; progress.totalXp += 10; }
    if (completed === true) item.completed = true;
    item.lastPlayedAt = new Date();
    progress.markModified("categories");
    await progress.save();
    res.json({ totalXp: progress.totalXp, categoryProgress: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save answer." });
  }
});


router.post("/complete-category", async (req, res) => {
  try {
    const { studentId, category } = req.body;
    if (!studentId || !CATEGORIES[category]) {
      return res.status(400).json({ message: "studentId and valid category are required." });
    }
    const progress = await Progress.findOne({ studentId });
    if (!progress) return res.status(404).json({ message: "Student progress was not found." });
    progress.categories[category].completed = true;
    progress.categories[category].lastPlayedAt = new Date();
    progress.markModified("categories");
    await progress.save();
    res.json({ message: "Category completed.", totalXp: progress.totalXp });
  } catch {
    res.status(500).json({ message: "Could not mark category complete." });
  }
});

router.post("/reset-category", async (req, res) => {
  try {
    const { studentId, category } = req.body;
    if (!studentId || !CATEGORIES[category]) return res.status(400).json({ message: "studentId and valid category are required." });
    const progress = await Progress.findOne({ studentId });
    if (!progress) return res.json({ message: "Nothing to reset." });
    // Reset completion and category statistics, but preserve lifetime XP.
    progress.categories[category] = { completed: false, correct: 0, attempted: 0, xp: 0, lastPlayedAt: null };
    progress.markModified("categories");
    await progress.save();
    res.json({ message: "Category progress reset. Lifetime XP is preserved.", totalXp: progress.totalXp });
  } catch {
    res.status(500).json({ message: "Could not reset category." });
  }
});

export default router;
