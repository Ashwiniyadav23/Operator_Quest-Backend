import express from "express";
import AuditLog from "../models/AuditLog.js";
import { answerTutorQuestion, classifySafety, requestsQuizAnswer, validateInput } from "../services/tutorService.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  const startedAt = Date.now();
  const { question, studentId } = req.body || {};
  let request = typeof question === "string" ? question.trim() : "";
  try {
    request = validateInput(question, studentId);
    if (classifySafety(request) === "blocked") {
      await AuditLog.create({ studentId, request, status: "blocked", safety: "blocked", latencyMs: Date.now() - startedAt });
      return res.status(400).json({ message: "I can only help with safe learning and programming questions." });
    }
    if (requestsQuizAnswer(request)) {
      await AuditLog.create({ studentId, request, status: "blocked", safety: "safe", latencyMs: Date.now() - startedAt });
      return res.status(400).json({ message: "I cannot give answers to quest questions. Ask me to explain the operator or concept instead." });
    }
    const result = await answerTutorQuestion(request, studentId);
    await AuditLog.create({
      studentId, request, status: result.status, safety: "safe",
      retrievedMaterials: result.materials, ...result.usage, latencyMs: Date.now() - startedAt
    });
    res.json({ explanation: result.response.explanation, questions: result.response.questions, usage: result.usage });
  } catch (error) {
    console.error("Tutor request error:", error);
    if (studentId && request) {
      await AuditLog.create({ studentId, request, status: "failed", safety: "safe", latencyMs: Date.now() - startedAt, error: error.message });
    }
    res.status(400).json({ message: error.message || "Could not answer the question." });
  }
});

export default router;
