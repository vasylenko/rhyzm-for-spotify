/// <reference types="vite/client" />

declare module 'virtual:uno.css' {
  const css: string
  export default css
}

declare module '@unocss/reset/tailwind.css' {
  const css: string
  export default css
}

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_SPOTIFY_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
