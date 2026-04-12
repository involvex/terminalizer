import { type ConfigData } from '../src/types/global.js';

interface PlayOptions {
  frameDelay?: string | number;
  maxIdleTime?: string | number;
  speedFactor?: number;
}

function playCallback(content: string, callback: () => void): void {
  process.stdout.write(content);
  callback();
}

function done(): void {
  process.stdout.write('\x1bc');
  process.exit();
}

export async function command(argv: Record<string, unknown>): Promise<void> {
  process.stdin.pause();

  const recordingFile = argv.recordingFile as ConfigData;
  const config = recordingFile.json.config as Record<string, unknown>;
  const options: PlayOptions = {
    frameDelay: config.frameDelay as string | number | undefined,
    maxIdleTime: config.maxIdleTime as string | number | undefined,
  };

  if (argv.realTiming) {
    options.frameDelay = 'auto';
    options.maxIdleTime = 'auto';
  }

  di.death(done);

  if (argv.speedFactor) {
    options.speedFactor = argv.speedFactor as number;
  }

  adjustFramesDelays(recordingFile.json.records as Array<{ content: string; delay: number }>, options);
  play(recordingFile.json.records as Array<{ content: string; delay: number }>, playCallback, null, options);
}

function adjustFramesDelays(records: Array<{ content: string; delay: number }>, options: PlayOptions): void {
  if (options.frameDelay === undefined) {
    options.frameDelay = 'auto';
  }
  if (options.maxIdleTime === undefined) {
    options.maxIdleTime = 2000;
  }
  if (options.speedFactor === undefined) {
    options.speedFactor = 1;
  }

  for (const record of records) {
    if (options.frameDelay !== 'auto') {
      record.delay = options.frameDelay as number;
    } else if (options.maxIdleTime !== 'auto' && record.delay > (options.maxIdleTime as number)) {
      record.delay = options.maxIdleTime as number;
    }
    record.delay = Math.floor(record.delay * (options.speedFactor ?? 1));
  }
}

function play(
  records: Array<{ content: string; delay: number }>,
  playCb: (content: string, cb: () => void) => void,
  doneCb: (() => void) | null,
  _options?: PlayOptions,
): void {
  const tasks: Array<(cb: () => void) => void> = [];

  for (const record of records) {
    tasks.push((callback) => {
      setTimeout(() => {
        playCb(record.content, callback);
      }, record.delay);
    });
  }

  di.async.series(tasks, () => {
    if (doneCb) {
      doneCb();
    }
  });
}

export const commandName = 'play <recordingFile>';
export const describe = 'Play a recording file on your terminal';
export const handler = command;

export function builder(yargs: import('yargs').Argv): import('yargs').Argv {
  return yargs
    .positional('recordingFile', {
      describe: 'The recording file',
      type: 'string',
      coerce: (arg: string) => di.utility.loadYAML(arg),
    })
    .option('r', {
      alias: 'real-timing',
      describe: 'Use the actual delays between frames as recorded',
      type: 'boolean',
      default: false,
    })
    .option('s', {
      alias: 'speed-factor',
      describe: 'Speed factor, multiply the frames delays by this factor',
      type: 'number',
      default: 1.0,
    });
}
