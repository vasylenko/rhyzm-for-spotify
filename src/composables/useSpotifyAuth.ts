import { ref, computed } from 'vue'
import { config } from '@/config'
import type { SpotifyTokens, SpotifyUser } from '@/types'

const STORAGE_KEY_TOKENS = 'spotify_tokens'
const STORAGE_KEY_VERIFIER = 'pkce_code_verifier'
const STORAGE_KEY_USER = 'spotify_user'

const tokens = ref<SpotifyTokens | null>(loadTokens())
const user = ref<SpotifyUser | null>(loadUser())
const isLoading = ref(false)
const error = ref<string | null>(null)

function loadTokens(): SpotifyTokens | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TOKENS)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function loadUser(): SpotifyUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveTokens(newTokens: SpotifyTokens): void {
  tokens.value = newTokens
  localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens))
}

function saveUser(newUser: SpotifyUser): void {
  user.value = newUser
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser))
}

function clearAuth(): void {
  tokens.value = null
  user.value = null
  localStorage.removeItem(STORAGE_KEY_TOKENS)
  localStorage.removeItem(STORAGE_KEY_USER)
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  bytes.forEach((byte) => {
    str += String.fromCharCode(byte)
  })
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier)
  return base64urlencode(hashed)
}

async function initiateLogin(): Promise<void> {
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  sessionStorage.setItem(STORAGE_KEY_VERIFIER, codeVerifier)

  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    scope: config.spotify.scopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  })

  window.location.href = `${config.spotify.authUrl}?${params.toString()}`
}

async function handleCallback(code: string): Promise<boolean> {
  isLoading.value = true
  error.value = null

  try {
    const codeVerifier = sessionStorage.getItem(STORAGE_KEY_VERIFIER)
    if (!codeVerifier) {
      throw new Error('Missing code verifier - please try logging in again')
    }

    const response = await fetch(config.spotify.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.spotify.clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.spotify.redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens')
    }

    const data = await response.json()

    saveTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    })

    sessionStorage.removeItem(STORAGE_KEY_VERIFIER)

    await fetchUserProfile()

    return true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Authentication failed'
    return false
  } finally {
    isLoading.value = false
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!tokens.value?.refreshToken) {
    return false
  }

  try {
    const response = await fetch(config.spotify.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.spotify.clientId,
        grant_type: 'refresh_token',
        refresh_token: tokens.value.refreshToken,
      }),
    })

    if (!response.ok) {
      clearAuth()
      return false
    }

    const data = await response.json()

    saveTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.value.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    })

    return true
  } catch {
    clearAuth()
    return false
  }
}

async function getValidAccessToken(): Promise<string | null> {
  if (!tokens.value) {
    return null
  }

  // Refresh if token expires in less than 5 minutes
  if (tokens.value.expiresAt - Date.now() < 5 * 60 * 1000) {
    const success = await refreshAccessToken()
    if (!success) {
      return null
    }
  }

  return tokens.value.accessToken
}

async function fetchUserProfile(): Promise<void> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return
  }

  try {
    const response = await fetch(`${config.spotify.apiBaseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user profile')
    }

    const data = await response.json()

    saveUser({
      id: data.id,
      displayName: data.display_name || data.id,
      imageUrl: data.images?.[0]?.url || null,
    })
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
  }
}

export function useSpotifyAuth() {
  const isAuthenticated = computed(() => !!tokens.value?.accessToken)

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    initiateLogin,
    handleCallback,
    getValidAccessToken,
    clearAuth,
  }
}
