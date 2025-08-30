type BootstrapStatus = {
  startedAt?: string
  finishedAt?: string
  ok: boolean | null
  lastError?: string
  logs: string[]
}

const status: BootstrapStatus = {
  ok: null,
  logs: [],
}

export function markStart() {
  status.startedAt = new Date().toISOString()
  status.ok = null
  status.lastError = undefined
  status.logs = []
  recordLog('Bootstrap started')
}

export function recordLog(message: string) {
  const line = `${new Date().toISOString()} ${message}`
  status.logs.push(line)
  // Keep last 200 log lines to avoid unbounded growth
  if (status.logs.length > 200) status.logs.splice(0, status.logs.length - 200)
}

export function markSuccess() {
  status.ok = true
  status.finishedAt = new Date().toISOString()
  recordLog('Bootstrap succeeded')
}

export function markFailure(err: unknown) {
  status.ok = false
  status.finishedAt = new Date().toISOString()
  const msg = err instanceof Error ? err.message : String(err)
  status.lastError = msg
  recordLog(`Bootstrap failed: ${msg}`)
}

export function getBootstrapStatus(): BootstrapStatus {
  return { ...status, logs: [...status.logs] }
}
