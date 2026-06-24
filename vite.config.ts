import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'

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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
