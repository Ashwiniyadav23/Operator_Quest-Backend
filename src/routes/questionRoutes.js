import express from "express";
import { CATEGORIES } from "../config/categories.js";
import { generateOperatorQuestions } from "../services/geminiService.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { category, operator, previousQuestions = [] } = req.body;
    if (!CATEGORIES[category]) return res.status(400).json({ message: "Please select a valid operator category." });
    if (!CATEGORIES[category].operators.includes(operator)) return res.status(400).json({ message: "Please select a valid operator for this category." });
    if (!Array.isArray(previousQuestions)) return res.status(400).json({ message: "previousQuestions must be an array." });
    const questions = await generateOperatorQuestions(category, operator, previousQuestions);
    res.json({ category, operator, questions, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Question generation error:", error);
    res.status(500).json({ message: error.message || "Could not generate questions." });
  }
});

export default router;
