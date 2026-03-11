import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(__dirname, '..')
const backendDir = path.resolve(frontendDir, '../backend')
const runtimeDir = path.join(frontendDir, '.playwright')
const dbPath = path.join(runtimeDir, 'e2e-backend.sqlite3')
const backendPort = process.env.PLAYWRIGHT_BACKEND_PORT ?? '8001'

await mkdir(runtimeDir, { recursive: true })
await rm(dbPath, { force: true })

const pythonExecutable = resolvePythonExecutable()
const backend = spawn(
  pythonExecutable,
  [
    '-m',
    'uvicorn',
    'app.main:app',
    '--app-dir',
    backendDir,
    '--host',
    '127.0.0.1',
    '--port',
    backendPort,
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: toSqliteUrl(dbPath),
    },
  },
)

forwardSignals(backend)

backend.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

function forwardSignals(childProcess) {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!childProcess.killed) {
        childProcess.kill(signal)
      }
    })
  }
}

function toSqliteUrl(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const absolutePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  return `sqlite+pysqlite:///${absolutePath}`
}

function resolvePythonExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_PYTHON,
    process.env.PYTHON,
    'python3',
    'python',
  ].filter(Boolean)

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['-c', 'import uvicorn'], { stdio: 'ignore' })
    if (result.status === 0) {
      return candidate
    }
  }

  throw new Error('A Python interpreter with uvicorn installed is required to run Playwright backend tests.')
}
