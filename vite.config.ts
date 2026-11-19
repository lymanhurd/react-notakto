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

export default defineConfig({
  plugins: [react(), versionPlugin()],
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
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
