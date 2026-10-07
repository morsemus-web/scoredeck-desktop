import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads the built index.html over file://, where Vite's default
  // absolute base ("/") resolves /assets/... to the root of the system drive
  // instead of into the asar. That silently loaded nothing, leaving a
  // transparent window with an empty #root. Relative paths are required.
  base: './',
  // Reported with anonymous usage events so reports can split by app version.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
})
