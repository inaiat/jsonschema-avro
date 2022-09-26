#!/usr/bin/env ts-node-esm

import { Logger, parseArgs } from './utils.js';

import { loadConfig, writeSchemas } from './avro-schema-gen.js';

async function jsonSchemaAvroGenerator(
  processArgv: string[],
  processExitFn: (code?: number) => never,
  logger: Logger
) {
  let helpPrinter: { showHelp: (consoleLevel?: string) => void }
  try {
    const { parsedYargs, command } = await parseArgs(processArgv.slice(2))
    helpPrinter = parsedYargs
    const argv = await parsedYargs.argv
    const { config } = await loadConfig(argv.config)

    if (command === 'generate') {
        await writeSchemas(config, logger)
    } else {
        await writeSchemas(config, logger, true)
    }

  } catch (error) {
    logger.error(error)
    processExitFn(1)
  }
}

jsonSchemaAvroGenerator(process.argv, process.exit, console)

