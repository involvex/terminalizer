function done(): void {
  console.log(di.chalk.green('The global config directory is created at'));
  console.log(di.chalk.magenta(di.utility.getGlobalDirectory()));
}

export async function command(_argv: Record<string, unknown>): Promise<void> {
  const globalPath = di.utility.getGlobalDirectory();

  try {
    di.fs.mkdirSync(globalPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }

  di.fs.copySync(di.path.join(ROOT_PATH, 'config.yml'), di.path.join(globalPath, 'config.yml'), { overwrite: true });

  done();
}

export const commandName = 'init';
export const describe = 'Create a global config directory';
export const handler = command;
