import yargs, { Argv } from 'yargs';

export type Logger = Pick<typeof console, 'debug' | 'log' | 'info' | 'warn' | 'error'>

const validCommands = ['generate', 'print'] as const
type Command = typeof validCommands[number]

export async function parseArgs(args: string[]): Promise<{
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
    .command('print', 'print model schemas to console')
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