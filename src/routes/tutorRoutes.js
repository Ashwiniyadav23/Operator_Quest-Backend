import express from "express";
import { answerTutorQuestion, classifySafety, requestsQuizAnswer, validateInput } from "../services/tutorService.js";
import { isTemporaryGeminiError } from "../services/geminiRequest.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  const { question, studentId } = req.body || {};
  let request = typeof question === "string" ? question.trim() : "";
  try {
    request = validateInput(question, studentId);
    if (classifySafety(request) === "blocked") {
      return res.status(400).json({ message: "I can only help with safe learning and programming questions." });
    }
    if (requestsQuizAnswer(request)) {
      return res.status(400).json({ message: "I cannot give answers to quest questions. Ask me to explain the operator or concept instead." });
    }
    const result = await answerTutorQuestion(request, studentId);
    res.json({ explanation: result.response.explanation, questions: result.response.questions, usage: result.usage });
  } catch (error) {
    console.error("Tutor request error:", error);
    const temporary = isTemporaryGeminiError(error);
    res.status(temporary ? 503 : 400).json({
      message: temporary ? "The flowchart guide is busy right now. Please try again in a moment." : error.message || "Could not answer the question."
    });
  }
});

export default router;
