// Simple test to verify the setup
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test TypeScript compilation
console.log('🔍 Testing TypeScript compilation...')
const tscProcess = spawn('npx', ['tsc', '--noEmit'], {
  cwd: __dirname,
  stdio: 'inherit'
})

tscProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ TypeScript compilation successful!')
  } else {
    console.log('❌ TypeScript compilation failed!')
    process.exit(1)
  }
})