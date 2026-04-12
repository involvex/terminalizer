import '../src/types/global.js';

function done(url: string): void {
  console.log(di.chalk.green('Successfully Uploaded'));
  console.log('The recording is available on the link:');
  console.log(di.chalk.magenta(url));
  process.exit();
}

function isSet(input: string): boolean | Error {
  if (!input) {
    return new Error('Required field');
  }
  return true;
}

async function getToken(): Promise<string> {
  let token = di.utility.getToken();

  if (token) {
    return token;
  }

  token = di.utility.generateToken();

  console.log('Open the following link in your browser and login into your account');
  console.log(di.chalk.dim(`${BASEURL}/token?token=${token}`) + '\n');

  return new Promise((resolve) => {
    console.log('When you do it, press any key to continue');
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const handler = (data: Buffer) => {
      if (data[0] === 0x03) {
        process.exit();
      }

      console.log(di.chalk.dim('Enjoy !') + '\n');
      process.stdin.pause();
      process.stdin.setRawMode(false);

      resolve(token);
    };

    process.stdin.once('data', handler);
  });
}

async function getMeta(context: Record<string, unknown>): Promise<Record<string, string>> {
  const platform = di.utility.getOS();

  if (context.getMeta) {
    return context.getMeta as Record<string, string>;
  }

  console.log('Please enter some details about your recording');

  const answers = await di.inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Title',
      validate: (input: string) => isSet(input),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description',
      validate: (input: string) => isSet(input),
    },
    {
      type: 'input',
      name: 'tags',
      message: `Tags ${di.chalk.dim('such as git,bash,game')}`,
      validate: (input: string) => isSet(input),
      default: platform,
    },
  ]);

  const params = { ...answers, platform };

  console.log();

  return params as Record<string, string>;
}

async function shareRecording(context: Record<string, unknown>): Promise<string> {
  const token = context.getToken as string;
  const meta = context.getMeta as Record<string, string>;
  const recordingFile = context.recordingFile as string;

  const options = {
    method: 'POST',
    url: `${BASEURL}/v1/recording`,
    formData: {
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      platform: meta.platform,
      token: token,
      file: {
        value: di.fs.createReadStream(recordingFile),
        options: {
          filename: 'recording.yml',
          contentType: 'application/x-yaml',
        },
      },
    },
  };

  const response = await di.axios(options);

  if (response.status === 500) {
    throw new Error((response.data.errors as string[]).join('\n'));
  }

  if (response.status === 400) {
    throw new Error((response.data.errors as string[]).join('\n'));
  }

  if (response.status === 401) {
    di.utility.removeToken();
    throw new Error('Token rejected, please try again');
  }

  if (response.status !== 200) {
    throw new Error('Something went wrong, try again later');
  }

  return response.data.url as string;
}

export async function command(argv: Record<string, unknown>): Promise<void> {
  if (!di.utility.isGlobalDirectoryCreated()) {
    const { command: initCommand } = await import('./init.js');
    await initCommand({});
  }

  const context: Record<string, unknown> = { ...argv };

  const token = await getToken();
  context.getToken = token;

  const meta = await getMeta(context);
  context.getMeta = meta;

  const url = await shareRecording(context);
  done(url);
}

export const commandName = 'share <recordingFile>';
export const describe = 'Upload a recording file and get a link for an online player';
export const handler = command;

export function builder(yargs: import('yargs').Argv): import('yargs').Argv {
  return yargs.positional('recordingFile', {
    describe: 'the recording file',
    type: 'string',
    coerce: (arg: string) => di.utility.resolveFilePath(arg, 'yml'),
  });
}
