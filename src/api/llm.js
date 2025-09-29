// Lightweight LLM wrapper that uses Gemini exclusively

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash-latest'

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

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(GEMINI_API_KEY)}`
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Gemini ListModels HTTP ${res.status} - ${txt}`)
  }
  const data = await res.json()
  return Array.isArray(data?.models) ? data.models : []
}

async function invokeGemini({ prompt, response_json_schema }) {
  const modelCandidates = [GEMINI_MODEL]
  if (GEMINI_MODEL?.endsWith('-latest')) modelCandidates.push(GEMINI_MODEL.replace(/-latest$/, ''))
  // If user configured a pro model and it 404s, a flash model might exist and vice versa
  if (GEMINI_MODEL?.includes('pro')) modelCandidates.push(GEMINI_MODEL.replace('pro', 'flash'))
  if (GEMINI_MODEL?.includes('flash')) modelCandidates.push(GEMINI_MODEL.replace('flash', 'pro'))
  // Also try commonly available numbered variants
  modelCandidates.push('gemini-1.5-pro-002', 'gemini-1.5-flash-002')

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
      // Try direct; if CORS/network fails, try proxy
      const directUrl = `https://generativelanguage.googleapis.com/${ver}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`
      try {
        let res
        try {
          res = await postWithRetry(directUrl, body)
        } catch (err) {
          // If browser blocked by CORS, fall back to Netlify proxy
          if (typeof window !== 'undefined' && /Failed to fetch|CORS|NetworkError|ERR_FAILED/i.test(err?.message || '')) {
            const proxyRes = await postWithRetry('/.netlify/functions/gemini-proxy', { model, apiVersion: ver, body })
            res = proxyRes
          } else {
            throw err
          }
        }
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (response_json_schema) {
          const jsonText = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()
          try { return JSON.parse(jsonText) } catch (e) { throw new Error('Gemini returned non-JSON') }
        }
        return { text }
      } catch (e) {
        lastErr = new Error(`${e?.message || e} for ${ver}/${model}`)
        // Try the next candidate
      }
    }
  }

  // If all direct candidates failed, discover available models and pick a supported one
  try {
    const models = await listModels()
    // Prefer 1.5 models that support generateContent; exclude 2.0 unless explicitly requested in env
    const want20 = /2\.0/.test(GEMINI_MODEL || '')
    const supported = models.filter(m => {
      const methods = m.supportedGenerationMethods || []
      const name = m.name || ''
      const is20 = /(^|\/)gemini-2\.0/.test(name)
      if (is20 && !want20) return false
      return methods.includes('generateContent')
    })
    const preferred = supported.sort((a, b) => {
      const score = (name) => (
        (name.includes('1.5') ? 200 : 0) +
        (name.includes('pro') ? 10 : 0) +
        (name.includes('flash') ? 5 : 0) +
        (/-\d+$/.test(name) ? 1 : 0)
      )
      return score(b.name || '') - score(a.name || '')
    })
    for (const m of preferred) {
      for (const ver of apiVersions) {
        const directUrl = `https://generativelanguage.googleapis.com/${ver}/${encodeURIComponent(m.name)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`
        try {
          let res
          try {
            res = await postWithRetry(directUrl, body)
          } catch (err) {
            if (typeof window !== 'undefined' && /Failed to fetch|CORS|NetworkError|ERR_FAILED/i.test(err?.message || '')) {
              const proxyRes = await postWithRetry('/.netlify/functions/gemini-proxy', { model: m.name.replace(/^models\//,''), apiVersion: ver, body })
              res = proxyRes
            } else {
              throw err
            }
          }
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (response_json_schema) {
            const jsonText = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim()
            try { return JSON.parse(jsonText) } catch (e) { throw new Error('Gemini returned non-JSON') }
          }
          return { text }
        } catch (e) {
          lastErr = new Error(`${e?.message || e} for ${ver}/${m.name}`)
        }
      }
    }
  } catch (e) {
    lastErr = e
  }
  throw lastErr || new Error('Gemini request failed')
}

export async function InvokeLLM({ prompt, response_json_schema }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }
  return await invokeGemini({ prompt, response_json_schema })
}


