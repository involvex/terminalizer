import { DIGraph } from './di.js';
import * as utility from './utility.js';
import type { DI, CommandModule } from './src/types/global.js';

 
const yargs = require('yargs');

const pkg = JSON.parse(JSON.stringify(require('./package.json')));

const diGraph = new DIGraph();
const di = diGraph.getProxy() as unknown as DI;

(globalThis as unknown as { di: DI }).di = di;
(globalThis as unknown as { ROOT_PATH: string }).ROOT_PATH = __dirname;
(globalThis as unknown as { BASEURL: string }).BASEURL = 'https://www.terminalizer.com';

diGraph.require('chalk');
diGraph.require('async');
diGraph.require('axios');
diGraph.require('death');
diGraph.require('path');
diGraph.require('os');
diGraph.require('electron');
diGraph.require('deepmerge');
diGraph.require('uuid');
diGraph.require('tmp');
diGraph.require('lodash', '_');
diGraph.require('fs-extra', 'fs');
diGraph.require('js-yaml', 'yaml');
diGraph.require('performance-now', 'now');
diGraph.require('async-promises', 'asyncPromises');
diGraph.require('string-argv', 'stringArgv');
diGraph.require('progress', 'ProgressBar');
diGraph.require('gif-encoder', 'GIFEncoder');
diGraph.require('inquirer');

diGraph.set('pty', require('@homebridge/node-pty-prebuilt-multiarch'));
diGraph.set('PNG', require('pngjs').PNG);
diGraph.set('spawn', require('child_process').spawn);
diGraph.set('utility', utility);
diGraph.set('errorHandler', errorHandler);

const commands: Record<string, CommandModule> = {
  init: require('./commands/init.js'),
  config: require('./commands/config.js'),
  record: require('./commands/record.js'),
  play: require('./commands/play.js'),
  render: require('./commands/render.js'),
  share: require('./commands/share.js'),
  generate: require('./commands/generate.js'),
};

diGraph.set('commands', commands);

function errorHandler(error: string | Error): void {
  const errStr = error.toString();
  console.error(`Error: \n  ${errStr}\n`);
  console.error(`Hint:\n  Use the ${di.chalk.green('--help')} option to get help about the usage`);
  process.exit(1);
}

export function startYargs(): void {
   
  const y: any = yargs;

  y.usage('Usage: $0 <command> [options]')
    .epilogue('For more information, check https://www.terminalizer.com')
    .version(pkg.version)
    .alias({ v: 'version', h: 'help' })
    .demandCommand(1, 'The command is missing')
    .strict()
    .wrap(100)
    .fail(errorHandler);

  y.command(commands.init.command, commands.init.describe, commands.init.builder, commands.init.handler);
  y.command(commands.config.command, commands.config.describe, commands.config.builder, commands.config.handler);
  y.command(commands.record.command, commands.record.describe, commands.record.builder, commands.record.handler);
  y.command(commands.play.command, commands.play.describe, commands.play.builder, commands.play.handler);
  y.command(commands.render.command, commands.render.describe, commands.render.builder, commands.render.handler);
  y.command(commands.share.command, commands.share.describe, commands.share.builder, commands.share.handler);
  y.command(
    commands.generate.command,
    commands.generate.describe,
    commands.generate.builder,
    commands.generate.handler,
  );

  y.parse();
}

if (require.main === module) {
  startYargs();
}
