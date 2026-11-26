import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { resolve } from 'path'

function getGitCommit() {
  try {
    return execSync("git rev-parse HEAD").toString().trim()
  } catch {
    return "local"
  }
}

function versionPlugin() {
  return {
    name: 'version-plugin',
    apply: 'build',
    closeBundle() {
      const version = {
        build: process.env.BUILD_NUMBER || "dev",
        commit: process.env.GITHUB_SHA || getGitCommit(),
        timestamp: new Date().toISOString()
      }

      mkdirSync('dist', { recursive: true })
      writeFileSync('dist/version.json', JSON.stringify(version, null, 2))
      console.log('✔ Generated dist/version.json:', version)
    }
  }
}

/**
 * Umami analytics (https://umami.is). Paste the site ID from the Umami dashboard
 * (Settings → Websites → Edit → Website ID). It is not a secret: it appears in
 * every page's HTML. Leave it empty to build without analytics. The UMAMI_WEBSITE_ID
 * environment variable overrides it.
 */
const UMAMI_WEBSITE_ID = '923f6683-6cb7-4c49-be2b-d2b0cbc27b16'

function analyticsPlugin() {
  const id = process.env.UMAMI_WEBSITE_ID || UMAMI_WEBSITE_ID
  return {
    name: 'umami-analytics',
    apply: 'build' as const,
    transformIndexHtml() {
      if (!id) return []
      return [{
        tag: 'script',
        attrs: {
          defer: true,
          src: 'https://cloud.umami.is/script.js',
          'data-website-id': id,
          // Only count the real site, never local previews.
          'data-domains': 'lymanslogicgames.com',
          // Respect the browser's "Do Not Track" setting.
          'data-do-not-track': 'true',
        },
        injectTo: 'head' as const,
      }]
    },
  }
}

export default defineConfig({
  plugins: [react(), versionPlugin(), analyticsPlugin()],
  build: {
    rollupOptions: {
      // One HTML entry per page. Add new games here (e.g. foo: resolve(__dirname, 'foo/index.html')).
      input: {
        main: resolve(__dirname, 'index.html'),
        notakto: resolve(__dirname, 'notakto/index.html'),
        discussion: resolve(__dirname, 'discussion.html'),
        nim: resolve(__dirname, 'nim/index.html'),
        grundy: resolve(__dirname, 'grundy/index.html'),
        kayles: resolve(__dirname, 'kayles/index.html'),
        silver: resolve(__dirname, 'silver/index.html'),
        wythoff: resolve(__dirname, 'wythoff/index.html'),
        misere: resolve(__dirname, 'misere-nim/index.html'),
        chomp: resolve(__dirname, 'chomp/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
