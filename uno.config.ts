import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  theme: {
    colors: {
      spotify: {
        green: '#1ED760',
        black: '#121212',
        white: '#FFFFFF',
        gray: '#B3B3B3',
      },
    },
  },
})
