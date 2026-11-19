const RETRY_DELAYS_MS = [800, 1800];

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
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      if (!isTemporaryGeminiError(error) || attempt >= RETRY_DELAYS_MS.length) throw error;
      const jitter = Math.floor(Math.random() * 250);
      await wait(RETRY_DELAYS_MS[attempt] + jitter);
    }
  }
}
