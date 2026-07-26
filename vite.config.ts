import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads the built index.html over file://, where Vite's default
  // absolute base ("/") resolves /assets/... to the root of the system drive
  // instead of into the asar. That silently loaded nothing, leaving a
  // transparent window with an empty #root. Relative paths are required.
  base: './',
})
