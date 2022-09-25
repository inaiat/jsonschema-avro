#!/usr/bin/env ts-node-esm

import { Logger } from '../types.js';
import yargs, { Argv } from 'yargs';
import { loadConfig, writeSchemas } from './avro-schema-gen.js';


const validCommands = ['generate'] as const
type Command = typeof validCommands[number]

async function parseArgs(args: string[]): Promise<{
  parsedYargs: Argv<{ config: string | undefined }>
  command: Command
}> {
  const parsedYargs = yargs(args)
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'path to the configuration file',
    })
    .command('generate', 'write model schemas to local files', {
      dryRun: { type: 'boolean' },
    })
    .demandCommand(
      1,
      1,
      'One of the above commands must be specified',
      'Only one command can be specified'
    )
    .strict()
    .help('h')
    .showHelpOnFail(true)

  const argv = await parsedYargs.argv

  const command = `${argv._[0]}` as Command

  return { parsedYargs, command }
}

async function jsonSchemaAvroGenerate(
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
    writeSchemas(config, logger)

  } catch (error) {
    logger.error(error)
    throw error
  }

}

jsonSchemaAvroGenerate(process.argv, process.exit, console)


