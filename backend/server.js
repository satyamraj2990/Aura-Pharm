import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'

const app = express()
const port = Number(process.env.PORT || 8787)
const apiKey = process.env.GEMINI_API_KEY
const configuredModels = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)
const modelCandidates = [...new Set([
  ...configuredModels,
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
])]
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000
const RESPONSE_CACHE_TTL_MS = 10 * 60 * 1000
const MAX_PROMPT_CHARS = 1200
const responseCache = new Map()
let quotaCooldownUntil = 0

const normalizePrompt = (message) => message.toLowerCase().trim().replace(/\s+/g, ' ')

const getCachedResponse = (message) => {
  const key = normalizePrompt(message)
  const cached = responseCache.get(key)
  if (!cached) return null
  if (Date.now() > cached.expiresAt) {
    responseCache.delete(key)
    return null
  }
  return cached.value
}

const setCachedResponse = (message, value) => {
  const key = normalizePrompt(message)
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
  })
}

// Greeting detection
const isGreeting = (message) => {
  const greetings = ['hi', 'hello', 'hey', 'yo', 'hii', 'hlo', 'greetings', 'sup', 'whats up']
  return greetings.some((greeting) => message.toLowerCase().trim() === greeting)
}

// Delay utility
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isQuotaError = (errorMessage) => /429|quota|rate limit|resource has been exhausted/i.test(errorMessage)
const isModelNotFoundError = (errorMessage) => /404\s*Not\s*Found|is not found|not supported for generateContent|model.*unavailable|permission.*model/i.test(errorMessage)

const buildQuotaFallbackResponse = (message) => {
  const trimmed = (message || '').trim()
  if (!trimmed) {
    return 'I am temporarily running in fallback mode due to AI quota limits. Please ask again in a little while.'
  }

  return [
    'I am temporarily running in fallback mode because the AI provider quota is exhausted.',
    'I cannot generate a full AI answer right now, but I can still help you structure your next step:',
    `1. Clarify goal: ${trimmed}`,
    '2. Break it into 3 small tasks you can complete in 10-15 minutes each.',
    '3. Start with task 1 now, then come back for a richer AI response once quota is restored.',
  ].join('\n')
}

const buildModelUnavailableFallbackResponse = (message) => {
  const trimmed = (message || '').trim()
  if (!trimmed) {
    return 'AI model endpoints are temporarily unavailable for this API key. Please try again in a bit.'
  }

  return [
    'AI model endpoints are temporarily unavailable for this API key, so I am using fallback mode.',
    `Your question: ${trimmed}`,
    'Quick study fallback:',
    '1. Define the topic in one sentence.',
    '2. List 3 key points you must remember.',
    '3. Write one real-world example.',
    '4. Review after 10 minutes and self-test without notes.',
  ].join('\n')
}

// Retry logic for API calls
const callGeminiWithRetry = async (genAI, message, models, maxRetries = 3) => {
  let lastError

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.4,
            topP: 0.9,
          },
        })
        const answer = result.response.text()?.trim()

        if (!answer) {
          throw new Error('Gemini returned an empty response.')
        }

        console.log(`✅ Success with model: ${modelName} (${answer.length} chars)`)
        return answer
      } catch (error) {
        lastError = error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (isModelNotFoundError(errorMessage)) {
          console.warn(`Gemini model unavailable: ${modelName}. Trying next model...`)
          break
        }

        if (isQuotaError(errorMessage)) {
          // Quota exhaustion is not transient; avoid hammering the provider.
          throw error
        }

        if (attempt < maxRetries) {
          console.log(`Transient error, retrying in 2 seconds (attempt ${attempt}/${maxRetries}) on ${modelName}...`)
          await delay(2000)
          continue
        }

        throw error
      }
    }
  }

  if (lastError instanceof Error && isModelNotFoundError(lastError.message)) {
    throw new Error(`No supported Gemini model found. Tried: ${models.join(', ')}`)
  }

  throw lastError
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.static('public'))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Main chat endpoint
app.post('/chat', async (req, res) => {
  const userMessage = req.body?.message?.trim()

  // Validate input
  if (!userMessage) {
    return res.status(400).json({ response: 'Please provide a message.' })
  }

  // Check for greetings first (no API call needed)
  if (isGreeting(userMessage)) {
    return res.json({ response: 'Whatsup 👋 How can I help you today?' })
  }

  // Validate API key
  if (!apiKey) {
    return res.status(500).json({ response: 'Server configuration error. API key missing.' })
  }

  if (Date.now() < quotaCooldownUntil) {
    return res.json({
      response: buildQuotaFallbackResponse(userMessage),
      fallback: true,
      cooldown: true,
    })
  }

  const cachedResponse = getCachedResponse(userMessage)
  if (cachedResponse) {
    return res.json({ response: cachedResponse, cached: true })
  }

  try {
    // Keep tiny delay for burst protection while staying responsive.
    await delay(200)

    const boundedPrompt = userMessage.length > MAX_PROMPT_CHARS
      ? `${userMessage.slice(0, MAX_PROMPT_CHARS)}...`
      : userMessage

    const genAI = new GoogleGenerativeAI(apiKey)
    const response = await callGeminiWithRetry(genAI, boundedPrompt, modelCandidates)

    // Clean response (remove markdown symbols if any)
    const cleanResponse = response
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .replace(/#{1,6}\s/g, '') // Remove headers
      .trim()

    setCachedResponse(userMessage, cleanResponse)
    return res.json({ response: cleanResponse })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (isQuotaError(errorMessage)) {
      quotaCooldownUntil = Date.now() + QUOTA_COOLDOWN_MS
      return res.json({
        response: buildQuotaFallbackResponse(userMessage),
        fallback: true,
        cooldown: true,
      })
    }

    if (isModelNotFoundError(errorMessage) || /No supported Gemini model found/i.test(errorMessage)) {
      return res.json({
        response: buildModelUnavailableFallbackResponse(userMessage),
        fallback: true,
        modelUnavailable: true,
      })
    }

    console.error('Gemini API error:', errorMessage)
    return res.status(500).json({
      response: 'Server busy, please try again in a moment.',
    })
  }
})

// Legacy endpoint for compatibility
app.post('/api/ai/chat', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : []
  const lastUserMessage = messages
    .reverse()
    .find((m) => m.role === 'user')?.content

  if (!lastUserMessage) {
    return res.status(400).json({ error: 'No user message found.' })
  }

  // Forward to new /chat endpoint
  const response = await fetch(`http://localhost:${port}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: lastUserMessage }),
  })

  const data = await response.json()
  
  if (response.ok) {
    return res.json({ answer: data.response })
  } else {
    return res.status(response.status).json({ error: data.response })
  }
})

app.listen(port, () => {
  console.log(`🤖 AI Chat Assistant listening on http://localhost:${port}`)
  console.log(`🧠 Gemini model candidates: ${modelCandidates.join(', ')}`)
  console.log(`📝 POST /chat - Send user messages`)
  console.log(`❤️  GET /health - Health check`)
})
