import { Config, Logger } from '../types.js';
import * as path from 'path'
import { convert } from '../index.js';
import { promises as fs } from 'fs'

function absolute(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath
  }
  return path.resolve(filePath)
}


export async function loadConfig(configLocation?: string): Promise<{ config: Config; }> {
  const configFileInput = configLocation ?? 'json-schema-avro.config.ts'
  const configFilePath = absolute(configFileInput)

  let config: Config

  try {
    const configRequired = await import(configFilePath)
    if ('default' in configRequired && configRequired.default.models) {
      config = configRequired.default
    } else {
      config = configRequired
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TSError') {
        throw new Error(
          `Could not load config file from ${configFilePath} due to TypeScript compilation error:\n${err.message}`
        )
      } else {
        throw new Error(
          `Could not load config file from ${configFilePath}\n\n${err.message}`
        )
      }
    }
    throw err
  }

  // validateConfig(config, configFilePath)

  if (config.outDir) {
    config.outDir = absolute(config.outDir)
  }

  return { config }
}

export async function writeSchemas(config: Config, logger: Logger) {
  Object.entries(config.models).map(async ([name, model]) => {
    const schema = convert(model.jsonSchema, model.options)
    const avroSchemaName = `${name}.avsc`
    const outputDir = config.outDir ?? 'avro-schemas'
    const outFilePath = path.join(outputDir, avroSchemaName)
    const writeableModel = JSON.stringify(schema)
    await fs.mkdir(path.dirname(outFilePath), { recursive: true })
    await fs.writeFile(outFilePath, writeableModel)
    logger.log(
      ` * wrote ${name} to ${avroSchemaName}`
    )
  })
}