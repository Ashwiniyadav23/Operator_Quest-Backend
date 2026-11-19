const RETRY_DELAYS_MS = [800, 1800];
const FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

function errorStatus(error) {
  return Number(error?.status ?? error?.statusCode ?? error?.response?.status ?? error?.cause?.status);
}

export function isTemporaryGeminiError(error) {
  const status = errorStatus(error);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;

  const code = `${error?.code || ""} ${error?.status || ""}`.toUpperCase();
  const message = `${error?.message || ""} ${error?.response?.data?.error?.status || ""}`.toUpperCase();
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|OVERLOADED|ECONNRESET|ETIMEDOUT|EAI_AGAIN/.test(`${code} ${message}`) ||
    /\b(408|429|500|502|503|504)\b/.test(message);
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function generateContentWithRetry(ai, request) {
  const configuredModel = request.model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  // Prefer the current high-throughput model when an older 2.5 model is still configured.
  const preferredModel = configuredModel.startsWith("gemini-2.5") ? "gemini-3.5-flash-lite" : configuredModel;
  const models = [...new Set([preferredModel, ...FALLBACK_MODELS, ...(configuredModel === preferredModel ? [] : [configuredModel])])];
  let lastError;

  for (const model of models) {
    const config = { ...request.config };
    if (config.thinkingConfig) {
      config.thinkingConfig = model.startsWith("gemini-2.5")
        ? { thinkingBudget: 0 }
        : { thinkingLevel: "minimal" };
    }

    const maxAttempts = model === preferredModel ? RETRY_DELAYS_MS.length + 1 : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await ai.models.generateContent({ ...request, model, config });
      } catch (error) {
        lastError = error;
        if (!isTemporaryGeminiError(error)) throw error;
        if (attempt < maxAttempts - 1) {
          const jitter = Math.floor(Math.random() * 250);
          await wait(RETRY_DELAYS_MS[attempt] + jitter);
        }
      }
    }
  }

  throw lastError;
}
