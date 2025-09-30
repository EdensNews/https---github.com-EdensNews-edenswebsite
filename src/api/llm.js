// Lightweight LLM wrapper that uses Gemini exclusively

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
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
    if (approxTokens > 3500) return 512
    if (approxTokens > 2500) return 768
    return 1024
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
  // First attempt direct candidates
  for (const ver of apiVersions) {
    for (const model of modelCandidates) {
      const directUrl = `https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`
      try {
        let res
        try {
          // Try direct first (works on some models in localhost)
          res = await postWithRetry(directUrl, body)
        } catch (err) {
          // If proxy base configured, fallback to proxy
          if (FUNCTIONS_BASE && /Failed to fetch|CORS|NetworkError|ERR_FAILED/i.test(err?.message || '')) {
            res = await postWithRetry(`${FUNCTIONS_BASE}/.netlify/functions/gemini-proxy`, { model, apiVersion: ver, body })
          } else {
            throw err
          }
        }
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (response_json_schema) {
          const jsonText = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()

          // Try to parse the JSON directly first
          try {
            return JSON.parse(jsonText)
          } catch (e) {
            // If that fails, try to extract just the JSON object part
            const jsonMatch = jsonText.match(/\{.*\}/s) // Match everything between first { and last }
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[0])
              } catch (e2) {
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
        // Try the next candidate
      }
    }
  }
  throw lastErr || new Error('Gemini request failed')
}

export async function InvokeLLM({ prompt, response_json_schema }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }
  return await invokeGemini({ prompt, response_json_schema })
}


