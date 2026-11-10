import { GoogleGenAI } from "@google/genai";
import { CATEGORIES } from "../config/categories.js";

const questionSchema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      question: { type: "STRING" },
      options: { type: "ARRAY", items: { type: "STRING" } },
      answerIndex: { type: "INTEGER" },
      explanation: { type: "STRING" },
      difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["question", "options", "answerIndex", "explanation", "difficulty"]
  }
};

function validateQuestions(value) {
  if (!Array.isArray(value) || value.length !== 10) {
    throw new Error("Gemini did not return exactly 10 questions. Please generate again.");
  }
  return value.map((q, i) => {
    if (
      typeof q.question !== "string" || !q.question.trim() ||
      !Array.isArray(q.options) || q.options.length !== 4 ||
      q.options.some(o => typeof o !== "string" || !o.trim()) ||
      !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3 ||
      typeof q.explanation !== "string" || !q.explanation.trim()
    ) {
      throw new Error(`Question ${i + 1} returned by Gemini has an invalid format.`);
    }
    if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== 4) {
      throw new Error(`Question ${i + 1} has duplicate answer options.`);
    }
    return {
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      question: q.question.trim(),
      options: q.options.map(o => o.trim()),
      answerIndex: q.answerIndex,
      explanation: q.explanation.trim(),
      difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty) ? q.difficulty : "Medium"
    };
  });
}

export async function generateOperatorQuestions(category, operator, previousQuestions = []) {
  const config = CATEGORIES[category];
  if (!config) throw new Error("Unknown operator category.");
  if (!config.operators.includes(operator)) throw new Error("Unknown operator for this category.");
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing. Add GEMINI_API_KEY to server/.env.");
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: "v1beta"
  });

  const avoid = previousQuestions.slice(0, 20).map(q => q.slice(0, 180));
  const prompt = `Create exactly 10 beginner-friendly multiple-choice questions for the ${config.label} operator "${operator}".
Category requirements: ${config.description}

Rules:
- Every question must directly test only the "${operator}" operator.
- Use the exact operator "${operator}" in the question or code expression whenever it is meaningful.
- Mix 4 Easy, 4 Medium and 2 Hard questions.
- Use different values and situations.
- For ternary, use Python conditional-expression syntax and focus on the conditional expression.
- Each question must have exactly four distinct options.
- answerIndex must be zero-based and point to exactly one correct option.
- Explanations must briefly teach the concept. Ensure answers are correct and unambiguous.
Avoid these earlier questions: ${JSON.stringify(avoid)}
Return only JSON matching the response schema.
`;
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: questionSchema,
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 1
    }
  });
  if (!response.text) throw new Error("Gemini returned an empty response.");
  return validateQuestions(JSON.parse(response.text));
}
