// Runs on server start (Node.js runtime). Ensures DB bootstrap executes once per process.
export const runtime = 'nodejs'

export async function register() {
  // No-op instrumentation to keep dev server lean. Bootstrap handled elsewhere.
}
