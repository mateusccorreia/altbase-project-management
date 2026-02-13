import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vite.dev/config/
export default defineConfig({
  base: './', // Necessário para rodar dentro do SharePoint (SiteAssets)
  plugins: [react()],
})
