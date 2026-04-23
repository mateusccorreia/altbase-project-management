import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vite.dev/config/
export default defineConfig({
  // Para GitHub Pages: usa o nome do repo como base path
  // Para dev local: o Vite ignora o base em modo dev (npm run dev)
  base: '/altbase-project-management/',
  plugins: [react()],
  server: {
    port: 5173
  }
})
