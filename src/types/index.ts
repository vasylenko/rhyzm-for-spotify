export interface SpotifyPlaylist {
  id: string
  name: string
  uri: string
  imageUrl: string | null
}

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  is_active: boolean
}

export interface Scene {
  id: string
  name: string
  playlist: {
    id: string
    name: string
    uri: string
    imageUrl: string | null
  }
  device: {
    id: string
    name: string
    type: string
  }
}

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface SpotifyUser {
  id: string
  displayName: string
  imageUrl: string | null
}
