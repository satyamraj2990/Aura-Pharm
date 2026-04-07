export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const ASSISTANT_TIMEOUT_MS = 20000
const configuredApiBaseUrl = (import.meta.env.VITE_ASSISTANT_API_BASE_URL as string | undefined)?.trim()
const normalizedApiBaseUrl = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, '')
  : ''
const browserHost = typeof window !== 'undefined' ? window.location.hostname : ''
const isRunningLocally = browserHost === 'localhost' || browserHost === '127.0.0.1'
const pointsToLocalhost = /(^https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedApiBaseUrl)
const effectiveApiBaseUrl = (!isRunningLocally && pointsToLocalhost)
  ? ''
  : normalizedApiBaseUrl
const assistantEndpoint = effectiveApiBaseUrl
  ? `${effectiveApiBaseUrl}/api/ai/chat`
  : '/api/ai/chat'

const parseAssistantError = (status: number, message: string) => {
  if (status === 429 || /quota|rate limit|insufficient_quota|resource has been exhausted/i.test(message)) {
    return 'Gemini quota has been exceeded for this API key/project. Check billing and usage limits, then try again.'
  }

  if (status === 502) {
    return 'Assistant backend is not reachable (502). Start backend server on port 8787 and try again.'
  }

  return message || `Assistant request failed with status ${status}.`
}

export const sendOpenAIMessage = async (messages: ChatMessage[]) => {
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) {
    throw new Error('No message to send.')
  }

  let response: Response
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS)

  try {
    response = await fetch(assistantEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Assistant request timed out. Please try again.')
    }
    const endpointHint = effectiveApiBaseUrl
      ? `Check backend URL: ${effectiveApiBaseUrl}`
      : 'If deployed, set VITE_ASSISTANT_API_BASE_URL to your deployed backend origin. If local, run backend on localhost:8787.'
    throw new Error(`Assistant backend is not reachable (${assistantEndpoint}). ${endpointHint}`)
  } finally {
    clearTimeout(timeoutHandle)
  }

  const payload = (await response.json().catch(() => ({}))) as {
    answer?: string
    error?: string
  }

  if (!response.ok) {
    throw new Error(parseAssistantError(response.status, payload.error || ''))
  }

  const answer = payload.answer?.trim()
  if (!answer) {
    throw new Error('Assistant returned an empty response.')
  }

  return answer
}