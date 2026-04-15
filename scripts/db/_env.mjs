import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

function stripWrappingQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, "utf8")

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim())

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export function loadProjectEnv() {
  const rootDir = process.cwd()

  loadEnvFile(path.join(rootDir, ".env"))
  loadEnvFile(path.join(rootDir, ".env.local"))
}

export function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`A variável ${name} é obrigatória para este script.`)
  }

  return value
}
