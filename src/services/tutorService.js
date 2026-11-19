import { GoogleGenAI } from "@google/genai";
import { LEARNING_MATERIALS } from "../config/learningMaterials.js";
import { generateContentWithRetry } from "./geminiRequest.js";

const MAX_INPUT_LENGTH = 1000;
const responseSchema = {
  type: "OBJECT",
  properties: {
    explanation: { type: "STRING" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          answer: { type: "STRING" }
        },
        required: ["question", "answer"]
      }
    }
  },
  required: ["explanation", "questions"]
};

const blockedPatterns = [
  /\b(password|api[\s_-]?key|secret|token|credential)\b/i,
  /\b(hack|exploit| malware|ransomware|phishing|steal|weapon|suicide)\b/i
];
const quizAnswerPatterns = [
  /\b(correct|right)\s+(answer|option)\b/i,
  /\b(answer|solve|solution)\s+(this|the|my)\b/i,
  /\b(solve|answer|complete)\s+(question|quiz|quest|problem)\b/i,
  /\bwhat\s+is\s+the\s+(answer|solution)\b/i,
  /\b(give|tell|show)\s+me\s+the\s+answer\b/i,
  /\b(answer|solution)s?\s+(to|of|for)\s+(these|those|the|my|this|that)?\s*(question|quiz|quest|problem)s?\b/i,
  /\b(give|tell|show|provide)\b.{0,40}\b(answer|solution)s?\b.{0,40}\b(question|quiz|quest|problem)s?\b/i,
  /\bquiz\s+(answer|solution)\b/i,
  /\b(answer|solution)\b.*\b(question|quiz|quest)\b/i,
  /\b(question|quiz|quest)\b.*\b(answer|solution)\b/i
];

function validateInput(question, studentId) {
  if (typeof studentId !== "string" || !studentId.trim()) throw new Error("studentId is required.");
  if (typeof question !== "string" || !question.trim()) throw new Error("question is required.");
  const value = question.trim();
  if (value.length > MAX_INPUT_LENGTH) throw new Error(`question must be ${MAX_INPUT_LENGTH} characters or fewer.`);
  return value;
}

function classifySafety(question) {
  return blockedPatterns.some(pattern => pattern.test(question)) ? "blocked" : "safe";
}

function requestsQuizAnswer(question) {
  return quizAnswerPatterns.some(pattern => pattern.test(question));
}

function retrieveMaterials(question) {
  const words = question.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return LEARNING_MATERIALS.filter(material =>
    material.keywords.some(keyword => words.includes(keyword))
  ).slice(0, 3);
}

function validateOutput(value) {
  if (!value || typeof value.explanation !== "string" || !value.explanation.trim() ||
      !Array.isArray(value.questions) || value.questions.length !== 3 ||
      value.questions.some(item => !item || typeof item.question !== "string" ||
        typeof item.answer !== "string" || !item.question.trim() || !item.answer.trim())) {
    throw new Error("The AI returned an invalid tutor response.");
  }
  return {
    explanation: value.explanation.trim(),
    questions: value.questions.map(item => ({
      question: item.question.trim(),
      answer: item.answer.trim()
    }))
  };
}

function estimateCost(inputTokens, outputTokens) {
  const inputRate = Number(process.env.GEMINI_INPUT_COST_PER_MILLION || 0);
  const outputRate = Number(process.env.GEMINI_OUTPUT_COST_PER_MILLION || 0);
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
}

export async function answerTutorQuestion(question, studentId) {
  const value = validateInput(question, studentId);
  if (classifySafety(value) === "blocked" || requestsQuizAnswer(value)) {
    return { status: "blocked", studentId, request: value, materials: [], usage: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 } };
  }

  const materials = retrieveMaterials(value);
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing. Add GEMINI_API_KEY to server/.env.");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: "v1beta" });
  const context = materials.map(material => `[${material.id}] ${material.content}`).join("\n");
  const response = await generateContentWithRetry(ai, {
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: `You are a safe, encouraging guide for students who are learning flowcharts and have not started coding. Explain flowchart symbols, process blocks, decision diamonds, arrows, and everyday logic in plain language. Create exactly 3 new practice questions with answers, using only flowchart scenarios and everyday situations.
Never provide the answer to an existing quiz or quest question. If the student asks for an existing quiz answer, refuse and offer to explain the relevant operator instead.
Do not use programming languages, source code, code blocks, coding syntax, or assume the student knows programming. When explaining an operator, describe how it works in a flowchart process block or decision diamond.
Student request: ${value}
Relevant learning material (use it as factual support when relevant):
${context || "No matching material was found; explain only well-established flowchart concepts."}
Return only JSON matching the response schema. Do not include unsafe instructions or secrets.`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.4
    }
  });
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  return {
    status: "completed",
    studentId,
    request: value,
    materials: materials.map(material => material.id),
    response: validateOutput(JSON.parse(response.text || "{}")),
    usage: { inputTokens, outputTokens, estimatedCostUsd: estimateCost(inputTokens, outputTokens) }
  };
}

export { classifySafety, requestsQuizAnswer, validateInput };
