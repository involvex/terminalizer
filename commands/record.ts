import { type ConfigData } from '../src/types/global.js';

let recordingFile: string | null = null;
let config: ConfigData = { json: {}, raw: '' };
let lastRecordTimestamp: number | null = null;
const records: Array<{ delay: number; content: string }> = [];

function normalizeConfig(cfg: ConfigData): ConfigData {
  if (!cfg.json.command) {
    if (di.os.platform() === 'win32') {
      di.utility.changeYAMLValue(cfg, 'command', 'powershell.exe');
    } else {
      di.utility.changeYAMLValue(cfg, 'command', 'bash -l');
    }
  }

  if (!cfg.json.cwd) {
    di.utility.changeYAMLValue(cfg, 'cwd', process.cwd());
  } else {
    di.utility.changeYAMLValue(cfg, 'cwd', di.path.resolve(cfg.json.cwd as string));
  }

  if (isNaN(cfg.json.cols as number)) {
    di.utility.changeYAMLValue(cfg, 'cols', process.stdout.columns);
  }

  if (isNaN(cfg.json.rows as number)) {
    di.utility.changeYAMLValue(cfg, 'rows', process.stdout.rows);
  }

  return cfg;
}

function getDuration(): number {
  const duration = Number(di.now().toFixed()) - (lastRecordTimestamp ?? 0);
  lastRecordTimestamp = Number(di.now().toFixed());
  return duration;
}

function onData(content: string): void {
  process.stdout.write(content);

  const duration = getDuration();

  if (duration < 5 && records.length > 0) {
    const lastRecord = records[records.length - 1];
    lastRecord.content += content;
    return;
  }

  records.push({
    delay: duration,
    content: content,
  });
}

function done(argv: Record<string, unknown>): void {
  let outputYAML = '';

  outputYAML += '# The configurations that used for the recording, feel free to edit them\n';
  outputYAML += 'config:\n\n';
  outputYAML += config.raw.replace(/^/gm, '  ');
  outputYAML += '\n# Records, feel free to edit them\n';
  outputYAML += di.yaml.dump({ records: records });

  try {
    if (recordingFile) {
      di.fs.writeFileSync(recordingFile, outputYAML, 'utf8');
    }
  } catch (error) {
    if (error instanceof Error) {
      di.errorHandler(error);
    }
    return;
  }

  console.log(di.chalk.green('Successfully Recorded'));
  console.log('The recording data is saved into the file:');
  console.log(di.chalk.magenta(recordingFile ?? ''));
  console.log('You can edit the file and even change the configurations.');
  console.log(`The command ${di.chalk.magenta('`terminalizer share`')}can be used anytime to share recordings!`);

  process.stdin.setRawMode(false);
  process.stdin.pause();

  if (argv.skipSharing) {
    return;
  }

  di.inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'share',
        message: 'Would you like to share your recording on www.terminalizer.com?',
      },
    ])
    .then((answers) => {
      if (!answers.share) {
        return;
      }

      console.log(di.chalk.green('Let\'s now share your recording on https://www.terminalizer.com'));

      const { handler } = di.commands.share as { handler: (argv: Record<string, unknown>) => Promise<void> };
      handler({
        recordingFile: recordingFile,
      });
    });
}

function command(argv: Record<string, unknown>): void {
  config = normalizeConfig(argv.config as ConfigData);
  recordingFile = argv.recordingFile as string;

  if (argv.command) {
    di.utility.changeYAMLValue(config, 'command', argv.command as string);
  }

  const args = di.stringArgv(config.json.command as string);
  const cmd = args[0];
  const commandArguments = args.slice(1);

  const ptyProcess = di.pty.spawn(cmd, commandArguments, {
    cols: config.json.cols as number,
    rows: config.json.rows as number,
    cwd: config.json.cwd as string,
    env: di.deepmerge(
      process.env as Record<string, string>,
      (config.json.env as Record<string, string>) || {},
    ) as Record<string, string>,
  });

  const onInput = ptyProcess.write.bind(ptyProcess);

  console.log('The recording session is started');
  console.log('Press', di.chalk.green('CTRL+D'), 'to exit and save the recording');

  process.stdin.on('data', onInput);
  ptyProcess.on('data', onData);
  ptyProcess.on('exit', () => {
    process.stdin.removeListener('data', onInput);
    done(argv);
  });

  process.stdout.setDefaultEncoding('utf8');
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

export async function handler(argv: Record<string, unknown>): Promise<void> {
  if (typeof argv.config === 'undefined') {
    argv.config = di.utility.getDefaultConfig();
  }

  command(argv);
}

export const commandName = 'record <recordingFile>';
export const describe = 'Record your terminal and create a recording file';

export function builder(yargs: import('yargs').Argv): import('yargs').Argv {
  return yargs
    .positional('recordingFile', {
      describe: 'A name for the recording file',
      type: 'string',
      coerce: (arg: string) => di.utility.resolveFilePath(arg, 'yml'),
    })
    .option('c', {
      alias: 'config',
      type: 'string',
      describe: 'Overwrite the default configurations',
      requiresArg: true,
      coerce: (arg: string) => di.utility.loadYAML(arg),
    })
    .option('d', {
      alias: 'command',
      type: 'string',
      describe: 'The command to be executed',
      requiresArg: true,
      default: null,
    })
    .option('k', {
      alias: 'skip-sharing',
      type: 'boolean',
      describe: 'Skip sharing and showing the sharing prompt message',
      requiresArg: false,
      default: false,
    })
    .example('$0 record foo', 'Start recording and create a recording file called foo.yml')
    .example('$0 record foo --config config.yml', 'Start recording with your own configurations');
}
