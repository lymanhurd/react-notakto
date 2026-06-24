import { writeFileSync } from "fs";
import { execSync } from "child_process";

function getGitCommit() {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "local";
  }
}

const version = {
  build: process.env.BUILD_NUMBER || "dev",
  commit: process.env.GITHUB_SHA || getGitCommit(),
  timestamp: new Date().toISOString()
};

// Write to public directory so it's available at build time
writeFileSync("public/version.json", JSON.stringify(version, null, 2));
console.log("✔ Wrote public/version.json:", version);
