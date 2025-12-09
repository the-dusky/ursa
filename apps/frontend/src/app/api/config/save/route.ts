import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // Validate that we have a proper config object
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid config data' },
        { status: 400 }
      )
    }

    // Required top-level keys
    const requiredKeys = ['version', 'energy', 'energyTax', 'movement', 'seasons', 'resourceConversion', 'harvestTable', 'board', 'players']
    for (const key of requiredKeys) {
      if (!(key in config)) {
        return NextResponse.json(
          { error: `Missing required config key: ${key}` },
          { status: 400 }
        )
      }
    }

    // Path to the config file
    const configPath = join(process.cwd(), 'src', 'config', 'game-config.json')

    // Write the config file with pretty formatting
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')

    return NextResponse.json({ success: true, message: 'Config saved successfully' })
  } catch (error) {
    console.error('Failed to save config:', error)
    return NextResponse.json(
      { error: 'Failed to save config file' },
      { status: 500 }
    )
  }
}
