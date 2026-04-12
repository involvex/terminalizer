import tmp from 'tmp';
import { type ConfigData } from '../src/types/global.js';

tmp.setGracefulCleanup();

const renderDir = tmp.dirSync({ unsafeCleanup: true }).name;

interface RenderOptions {
  step: number;
}

interface MergeOptions {
  quality: number;
  repeat: number;
  step: number;
  outputFile: string;
}

interface FrameDimensions {
  width: number;
  height: number;
}

function getProgressBar(operation: string, framesCount: number): { tick: () => void; complete: boolean } {
  return new di.ProgressBar(`${operation} ${di.chalk.magenta('frame :current/:total')} :percent [:bar] :etas`, {
    width: 30,
    total: framesCount,
  });
}

function writeRecordingData(recordingFile: ConfigData): Promise<void> {
  return new Promise((resolve, reject) => {
    di.fs.writeFile(
      di.path.join(ROOT_PATH, 'render/data.json'),
      JSON.stringify(recordingFile.json),
      'utf8',
      (error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      },
    );
  });
}

function loadPNG(path: string): Promise<{ width: number; height: number; data: Uint8Array }> {
  return new Promise((resolve, reject) => {
    di.fs.readFile(path, (error, imageData) => {
      if (error) {
        return reject(error);
      }

      new di.PNG().parse(imageData, (err, data) => {
        if (err) {
          return reject(err);
        }

        resolve(data as { width: number; height: number; data: Uint8Array });
      });
    });
  });
}

async function getFrameDimensions(): Promise<FrameDimensions> {
  const framePath = di.path.join(renderDir, '0.png');
  const png = await loadPNG(framePath);
  return {
    width: png.width,
    height: png.height,
  };
}

function renderFrames(
  records: Array<{ content: string; delay: number | string }>,
  options: RenderOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const framesCount = records.length;
    const start = Date.now();

    const progressBar = getProgressBar('Rendering', Math.ceil(framesCount / options.step));

    const render = di.spawn(
      di.electron as string,
      [di.path.join(ROOT_PATH, 'render/index.js'), renderDir, String(options.step)],
      { detached: false },
    );

    render.stdout?.on('data', (data) => {
      if (isNaN(parseInt(data.toString()))) {
        return;
      }
      progressBar.tick();
    });

    render.stderr?.on('data', (error) => {
      if (error && error instanceof Buffer) {
        console.log(di.chalk.yellow(`[render] ${error.toString('utf8').trim()}`));
      } else {
        render.kill();
        reject(new Error(`Unknown error [${typeof error}]: ${error}`));
      }
    });

    render.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Rendering exited with code ${code}`));
      } else {
        if (progressBar.complete) {
          console.log(di.chalk.green(`[render] Process successfully completed in ${Date.now() - start}ms.`));
        } else {
          console.log(di.chalk.yellow('[render] Process completion unverified'));
        }
        resolve();
      }
    });
  });
}

function mergeFrames(
  records: Array<{ content: string; delay: number | string }>,
  options: MergeOptions,
  frameDimensions: FrameDimensions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const framesCount = records.length;
    const start = Date.now();
    let stepsCounter = 0;

    const progressBar = getProgressBar('Merging', Math.ceil(framesCount / options.step));

    const gif = new di.GIFEncoder(frameDimensions.width, frameDimensions.height, {
      highWaterMark: 5 * 1024 * 1024,
    });

    gif.pipe(di.fs.createWriteStream(options.outputFile));

    gif.setQuality(101 - options.quality);
    gif.setRepeat(options.repeat);
    gif.writeHeader();

    di.async.eachOfSeries(
      records,
      (_frame: unknown, index: string | number, callback: (err?: Error) => void) => {
        const idx = Number(index);
        if (stepsCounter !== 0) {
          stepsCounter = (stepsCounter + 1) % options.step;
          return callback();
        }

        stepsCounter = (stepsCounter + 1) % options.step;

        const framePath = di.path.join(renderDir, `${idx}.png`);

        const idxNum = Number(index);
        loadPNG(framePath)
          .then((png) => {
            progressBar.tick();
            const nextIndex = (idxNum + 1) % records.length;
            const delay = Number(records[nextIndex].delay);
            gif.setDelay(delay);
            gif.addFrame(png.data);
            callback();
          })
          .catch(callback);
      },
      (error) => {
        if (error) {
          return reject(error);
        }

        gif.finish();
        console.log(di.chalk.green(`[merge] Process successfully completed in ${Date.now() - start}ms.`));
        resolve();
      },
    );
  });
}

function cleanup(): Promise<void> {
  return new Promise((resolve, reject) => {
    di.fs.emptyDir(di.path.join(ROOT_PATH, 'render/frames'), (error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}

function done(outputFile: string): void {
  console.log(`\n${di.chalk.green('Successfully Rendered')}`);
  console.log('The animated GIF image is saved into the file:');
  console.log(di.chalk.magenta(outputFile));
  process.exit();
}

export async function command(argv: Record<string, unknown>): Promise<void> {
  const recordingFile = argv.recordingFile as ConfigData;
  const records = recordingFile.json.records as Array<{ content: string; delay: number | string }>;
  const config = recordingFile.json.config as Record<string, unknown>;

  let outputFile = di.utility.resolveFilePath(`render${Date.now()}`, 'gif');

  const adjustFramesDelaysOptions = {
    frameDelay: config.frameDelay,
    maxIdleTime: config.maxIdleTime,
  };

  const renderingOptions: RenderOptions = {
    step: argv.step as number,
  };

  const mergingOptions: MergeOptions = {
    quality: config.quality as number,
    repeat: config.repeat as number,
    step: argv.step as number,
    outputFile: outputFile,
  };

  if (argv.quality) {
    mergingOptions.quality = argv.quality as number;
  }

  if (argv.output) {
    outputFile = argv.output as string;
    mergingOptions.outputFile = argv.output as string;
  }

  try {
    await cleanup();
    await writeRecordingData(recordingFile);
    await renderFrames(records, renderingOptions);
    const rec = records as Array<{ content: string; delay: number }>;
    const playModule = di.commands.play as {
      adjustFramesDelays: (
        records: Array<{ content: string; delay: number }>,
        options: Record<string, unknown>,
      ) => void;
    };
    playModule.adjustFramesDelays(rec, adjustFramesDelaysOptions);
    const dimensions = await getFrameDimensions();
    await mergeFrames(records, mergingOptions, dimensions);
    await cleanup();
    done(outputFile);
  } catch (error) {
    if (error instanceof Error) {
      di.errorHandler(error);
    }
  }
}

export const commandName = 'render <recordingFile>';
export const describe = 'Render a recording file as an animated gif image';
export const handler = command;

export function builder(yargs: import('yargs').Argv): import('yargs').Argv {
  return yargs
    .positional('recordingFile', {
      describe: 'The recording file',
      type: 'string',
      coerce: (arg: string) => di.utility.loadYAML(arg),
    })
    .option('o', {
      alias: 'output',
      type: 'string',
      describe: 'A name for the output file',
      requiresArg: true,
      coerce: (arg: string) => di.utility.resolveFilePath(arg, 'gif'),
    })
    .option('q', {
      alias: 'quality',
      type: 'number',
      describe: 'The quality of the rendered image (1 - 100)',
      requiresArg: true,
    })
    .option('s', {
      alias: 'step',
      type: 'number',
      describe: 'To reduce the number of rendered frames (step > 1)',
      requiresArg: true,
      default: 1,
    });
}
