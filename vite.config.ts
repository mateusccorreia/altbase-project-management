import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vite.dev/config/
export default defineConfig({
  base: '/altbase-project-management/', // Base path para GitHub Pages
  plugins: [react()],
})
