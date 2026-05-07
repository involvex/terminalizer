import { DIGraph } from './di.js';
import * as utility from './utility.js';
import type { DI, CommandModule } from './src/types/global.js';
import { fileURLToPath } from 'url';
import path from 'path';

import yargs from 'yargs';
import hasFlag from 'has-flag';
import pkg from './package.json' with { type: 'json' };
import pty from '@homebridge/node-pty-prebuilt-multiarch';
import { PNG } from 'pngjs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_PATH = path.resolve(__dirname, '..');

const forceColor = hasFlag('no-color') === false && hasFlag('color') !== false;
if (forceColor) {
  process.env.FORCE_COLOR = '1';
}

const chalk = (await import('chalk')).default;
if (forceColor) {
  chalk.level = 1;
}

const diGraph = new DIGraph();
const di = diGraph.getProxy() as unknown as DI;

(globalThis as unknown as { di: DI }).di = di;
(globalThis as unknown as { ROOT_PATH: string }).ROOT_PATH = ROOT_PATH;
(globalThis as unknown as { BASEURL: string }).BASEURL = 'https://www.terminalizer.com';

diGraph.set('chalk', chalk);

await diGraph.require('async');
await diGraph.require('axios');
await diGraph.require('death');
await diGraph.require('path');
await diGraph.require('os');
await diGraph.require('electron');
await diGraph.require('deepmerge');
await diGraph.require('uuid');
await diGraph.require('tmp');
await diGraph.require('lodash', '_');
await diGraph.require('fs-extra', 'fs');
await diGraph.require('js-yaml', 'yaml');
await diGraph.require('performance-now', 'now');
await diGraph.require('async-promises', 'asyncPromises');
await diGraph.require('string-argv', 'stringArgv');
await diGraph.require('progress', 'ProgressBar');
await diGraph.require('gif-encoder', 'GIFEncoder');
await diGraph.require('inquirer');

diGraph.set('pty', pty);
diGraph.set('PNG', PNG);
diGraph.set('spawn', spawn);
diGraph.set('utility', utility);
diGraph.set('errorHandler', errorHandler);

function errorHandler(error: string | Error): void {
  const errStr = error.toString();
  console.error(`Error: \n  ${errStr}\n`);
  console.error(`Hint:\n  Use the ${di.chalk.green('--help')} option to get help about the usage`);
  process.exit(1);
}

async function loadCommands(): Promise<Record<string, CommandModule>> {
  const modules = await Promise.all([
    import('./commands/init.js'),
    import('./commands/config.js'),
    import('./commands/record.js'),
    import('./commands/play.js'),
    import('./commands/render.js'),
    import('./commands/share.js'),
    import('./commands/generate.js'),
  ]);

  return {
    init: modules[0] as CommandModule,
    config: modules[1] as CommandModule,
    record: modules[2] as CommandModule,
    play: modules[3] as CommandModule,
    render: modules[4] as CommandModule,
    share: modules[5] as CommandModule,
    generate: modules[6] as CommandModule,
  };
}

export async function startYargs(): Promise<void> {
  const commands = await loadCommands();
  diGraph.set('commands', commands);

  const y = yargs();

  y.usage('Usage: $0 <command> [options]')
    .epilogue('For more information, check https://www.terminalizer.com')
    .version(pkg.version)
    .alias({ v: 'version', h: 'help' })
    .wrap(100)
    .fail(errorHandler)
    .showHelpOnFail(true);

  y.command(commands.init.commandName, commands.init.describe, (yargs: any) => yargs, commands.init.handler);
  y.command(
    commands.config.commandName,
    commands.config.describe,
    commands.config.builder || ((yargs: any) => yargs),
    commands.config.handler,
  );
  y.command(
    commands.record.commandName,
    commands.record.describe,
    commands.record.builder || ((yargs: any) => yargs),
    commands.record.handler,
  );
  y.command(
    commands.play.commandName,
    commands.play.describe,
    commands.play.builder || ((yargs: any) => yargs),
    commands.play.handler,
  );
  y.command(
    commands.render.commandName,
    commands.render.describe,
    commands.render.builder || ((yargs: any) => yargs),
    commands.render.handler,
  );
  y.command(
    commands.share.commandName,
    commands.share.describe,
    commands.share.builder || ((yargs: any) => yargs),
    commands.share.handler,
  );
  y.command(
    commands.generate.commandName,
    commands.generate.describe,
    commands.generate.builder || ((yargs: any) => yargs),
    commands.generate.handler,
  );

  y.parse(process.argv.slice(2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await startYargs();
}
