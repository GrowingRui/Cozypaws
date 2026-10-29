import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Defaults to 3001 because another project's serve.mjs already uses 3000. Override with PORT.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.PORT ?? 3001), strictPort: true },
  preview: { port: Number(process.env.PORT ?? 3001), strictPort: true },
})
