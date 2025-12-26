import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  theme: {
    colors: {
      spotify: {
        green: '#1DB954',
        black: '#191414',
        white: '#FFFFFF',
        gray: '#B3B3B3',
      },
    },
  },
})
