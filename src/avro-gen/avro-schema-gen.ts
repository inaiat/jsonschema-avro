import { Config } from '../types.js';
import { Logger } from './types.js'
import * as path from 'node:path'
import { convert } from '../index.js';
import { promises as fs } from 'node:fs'
import { isError } from '../guard.js';

const defaultConfigFile = 'json-schema-avro.mts'
const defaultOutputDir = 'avro-schemas'

function absolute(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath
  }
  return path.resolve(filePath)
}

export async function loadConfig(configLocation?: string): Promise<{ config: Config; }> {
  const configFileInput = configLocation ?? defaultConfigFile
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
      if (isError(err)) {
        throw new Error(
          `Could not load config file from ${configFilePath}\n\n${err?.message}`
        )
      }
      throw err
  }

  if (config.outDir) {
    config.outDir = absolute(config.outDir)
  }

  return { config }
}

export async function writeSchemas(config: Config, logger: Logger, printOnly = false) {
  const outputDir = config.outDir ?? defaultOutputDir
  try {
    Object.entries(config.models).map(async ([name, model]) => {
      const schema = convert(model.jsonSchema, model.options)
      const avroSchemaName = `${name}.avsc`
      const outFilePath = path.join(outputDir, avroSchemaName)
      const writeableModel = JSON.stringify(schema)
      if (printOnly) {
        logger.log(`${name} - ${outFilePath}\n${writeableModel}\n\n`)
      } else {
        await fs.mkdir(path.dirname(outFilePath), { recursive: true })
        await fs.writeFile(outFilePath, writeableModel)
        logger.log(
          ` * wrote ${name} to ${outFilePath}`
        )
      }
    })
  } catch (err) {
    if (isError(err)) {
      throw new Error(
        `Could not write schema file on ${outputDir}\n\n${err?.message}`
      )
    }
    throw err
  }

}