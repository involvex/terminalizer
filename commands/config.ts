function done(): void {
  console.log(di.chalk.green('Successfully Saved'));
  console.log('The config file is saved into the file:');
  console.log(di.chalk.magenta('config.yml'));
}

export async function command(_argv: Record<string, unknown>): Promise<void> {
  di.fs.copySync(di.path.join(ROOT_PATH, 'config.yml'), 'config.yml');
  done();
}

export const commandName = 'config';
export const describe = 'Generate a config file in the current directory';
export const handler = command;
