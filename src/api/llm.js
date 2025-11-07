// Lightweight LLM wrapper that uses Gemini exclusively

const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE || ''

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function postWithRetry(url, body, { maxRetries = 4, initialDelayMs = 1000, backoffFactor = 2, timeoutMs = 20000 } = {}) {
  let attempt = 0
  let delay = initialDelayMs
  let lastError = null
  // One initial try + retries
  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (res.ok) return res
      const status = res.status
      const text = await res.text().catch(() => '')
      // Retry on 429 or 5xx
      const isRetryable = status === 429 || status === 408 || (status >= 500 && status < 600)
      if (!isRetryable || attempt === maxRetries) {
        throw new Error(`Gemini HTTP ${status} - ${text}`)
      }
      lastError = new Error(`Gemini HTTP ${status} - ${text}`)
    } catch (e) {
      // Network errors are retryable
      lastError = e
      const isLast = attempt === maxRetries
      if (isLast) break
    }
    attempt += 1
    const jitter = Math.floor(Math.random() * 250)
    await sleep(delay + jitter)
    delay *= backoffFactor
  }
  throw lastError || new Error('Gemini request failed')
}

// listModels removed from client to avoid CORS; rely on explicit candidates

async function invokeGemini({ prompt, response_json_schema }) {
  const modelCandidates = [ (GEMINI_MODEL || '').replace(/-latest$/, '') || 'gemini-2.0-flash' ]

  const systemInstruction = 'You are a translation assistant. When asked to return JSON, return ONLY strict, valid JSON with no extra text.'

  function computeMaxTokens(promptText) {
    const approxTokens = Math.ceil((promptText || '').length / 4)
    // Increased token limits to support ~801 words (approximately 1000-1200 tokens)
    if (approxTokens > 5000) return 1200
    if (approxTokens > 3500) return 1500
    if (approxTokens > 2500) return 1800
    return 2048
  }
  const body = {
    contents: [
      { role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: computeMaxTokens(prompt)
    }
  }

  const apiVersions = ['v1', 'v1beta']
  let lastErr = null
  // Always use serverless proxy to avoid exposing API key and CORS/leak issues
  const base = FUNCTIONS_BASE || ''
  for (const ver of apiVersions) {
    for (const model of modelCandidates) {
      try {
        const res = await postWithRetry(`${base}/.netlify/functions/gemini-proxy`, { model, apiVersion: ver, body })
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (response_json_schema) {
          const jsonText = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()
          try {
            return JSON.parse(jsonText)
          } catch (e) {
            const jsonMatch = jsonText.match(/\{.*\}/s)
            if (jsonMatch) {
              try { return JSON.parse(jsonMatch[0]) } catch (e2) {
                console.error('Gemini JSON parse error:', e2)
                console.error('Original response:', text)
                console.error('Extracted JSON:', jsonMatch[0])
              }
            }
            throw new Error('Gemini returned non-JSON')
          }
        }
        return { text }
      } catch (e) {
        lastErr = new Error(`${e?.message || e} for ${ver}/${model}`)
      }
    }
  }
  throw lastErr || new Error('Gemini request failed')
}

export async function InvokeLLM({ prompt, response_json_schema }) {
  return await invokeGemini({ prompt, response_json_schema })
}


