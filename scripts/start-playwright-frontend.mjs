import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(__dirname, '..')
const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '4173'
const backendPort = process.env.PLAYWRIGHT_BACKEND_PORT ?? '8001'
const viteExecutable =
  process.platform === 'win32'
    ? path.join(frontendDir, 'node_modules', '.bin', 'vite.cmd')
    : path.join(frontendDir, 'node_modules', '.bin', 'vite')

const frontend = spawn(
  viteExecutable,
  ['--host', '127.0.0.1', '--port', frontendPort],
  {
    cwd: frontendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_API_BASE_URL: `http://127.0.0.1:${backendPort}/api/v1`,
    },
  },
)

forwardSignals(frontend)

frontend.on('exit', (code, signal) => {
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
