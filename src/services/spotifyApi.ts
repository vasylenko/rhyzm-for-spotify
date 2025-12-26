import { config } from '@/config'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import type { SpotifyPlaylist, SpotifyDevice } from '@/types'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const { getValidAccessToken } = useSpotifyAuth()
  const accessToken = await getValidAccessToken()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${config.spotify.apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (response.status === 401) {
    throw new Error('Authentication expired - please log in again')
  }

  return response
}

export async function getUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = []
  let nextUrl: string | null = '/me/playlists?limit=50'

  while (nextUrl) {
    const response = await fetchWithAuth(nextUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch playlists')
    }

    const data = await response.json()

    for (const item of data.items) {
      playlists.push({
        id: item.id,
        name: item.name,
        uri: item.uri,
        imageUrl: item.images?.[0]?.url || null,
      })
    }

    // Handle pagination - next URL is absolute, need to extract path
    if (data.next) {
      const url = new URL(data.next)
      nextUrl = url.pathname.replace('/v1', '') + url.search
    } else {
      nextUrl = null
    }
  }

  return playlists
}

export async function getAvailableDevices(): Promise<SpotifyDevice[]> {
  const response = await fetchWithAuth('/me/player/devices')

  if (!response.ok) {
    throw new Error('Failed to fetch devices')
  }

  const data = await response.json()

  return data.devices.map((device: Record<string, unknown>) => ({
    id: device.id as string,
    name: device.name as string,
    type: device.type as string,
    is_active: device.is_active as boolean,
  }))
}

export async function startPlayback(
  contextUri: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetchWithAuth(`/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        context_uri: contextUri,
      }),
    })

    // 204 No Content = success
    if (response.status === 204) {
      return { success: true }
    }

    // 404 = device not found
    if (response.status === 404) {
      return { success: false, error: 'Device not found or offline' }
    }

    // 403 = Premium required or playback restricted
    if (response.status === 403) {
      const data = await response.json()
      return { success: false, error: data.error?.message || 'Playback restricted - Premium required' }
    }

    const data = await response.json()
    return { success: false, error: data.error?.message || 'Playback failed' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Playback failed' }
  }
}
