#!/usr/bin/env node

/**
 * Environment Configuration Script
 * 
 * Helps switch between local and remote Y.js server configurations
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const configs = {
  'local-docker': {
    file: '.env.docker',
    description: 'Local Docker development with Y.js container'
  },
  'local-native': {
    file: '.env.local.example',
    description: 'Local native development (npm run server)'
  },
  'remote': {
    file: '.env.remote',
    description: 'Remote development using Railway Y.js server'
  }
}

function copyEnvFile(configType) {
  const config = configs[configType]
  if (!config) {
    console.error(`❌ Unknown config type: ${configType}`)
    console.log('Available configurations:')
    Object.entries(configs).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.description}`)
    })
    process.exit(1)
  }

  const sourcePath = path.join(rootDir, config.file)
  const targetPath = path.join(rootDir, 'apps/frontend/.env.local')

  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source configuration file not found: ${sourcePath}`)
      process.exit(1)
    }

    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Copy the file
    fs.copyFileSync(sourcePath, targetPath)
    
    console.log(`✅ Environment configured for: ${config.description}`)
    console.log(`📝 Configuration copied from: ${config.file}`)
    console.log(`📁 Target: apps/frontend/.env.local`)
    
    // Show the configuration
    const content = fs.readFileSync(targetPath, 'utf8')
    const yjsServer = content.match(/NEXT_PUBLIC_YJS_SERVER=(.+)/)?.[1]
    if (yjsServer) {
      console.log(`🔌 WebSocket URL: ${yjsServer}`)
    }

  } catch (error) {
    console.error(`❌ Failed to configure environment: ${error.message}`)
    process.exit(1)
  }
}

function showCurrentConfig() {
  const envPath = path.join(rootDir, 'apps/frontend/.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('📄 No .env.local configuration found')
    console.log('🔧 Run: node scripts/configure-env.js <config-type>')
    return
  }

  const content = fs.readFileSync(envPath, 'utf8')
  const yjsServer = content.match(/NEXT_PUBLIC_YJS_SERVER=(.+)/)?.[1]
  const devMode = content.match(/DEVELOPMENT_MODE=(.+)/)?.[1]
  
  console.log('📄 Current configuration:')
  console.log(`🔌 WebSocket URL: ${yjsServer || 'Not set'}`)
  console.log(`⚙️  Development Mode: ${devMode || 'Not set'}`)
}

// Main script logic
const command = process.argv[2]

if (!command) {
  console.log('🎮 Seasonal Board Game - Environment Configuration')
  console.log('')
  showCurrentConfig()
  console.log('')
  console.log('Available commands:')
  console.log('  node scripts/configure-env.js <config-type>')
  console.log('  node scripts/configure-env.js status')
  console.log('')
  console.log('Configuration types:')
  Object.entries(configs).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(15)} - ${value.description}`)
  })
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/configure-env.js local-docker   # Use local Docker Y.js server')
  console.log('  node scripts/configure-env.js remote         # Use Railway Y.js server')
  console.log('  node scripts/configure-env.js status         # Show current configuration')
} else if (command === 'status') {
  showCurrentConfig()
} else {
  copyEnvFile(command)
}