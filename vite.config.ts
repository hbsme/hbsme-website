import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isProd = process.env.NODE_ENV === 'production'

const config = defineConfig({
  server: {
    allowedHosts: ['dev.hbsme.fr', 'handball-saint-medard-deyrans.fr'],
  },
  plugins: [
    ...(isProd ? [] : [devtools()]),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      server: {
        preset: 'node-server',
      },
    }),
    viteReact(),
  ],
})

export default config
