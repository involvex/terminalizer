function done(): void {
  console.log('This command is not implemented yet. It will be available in the next versions');
}

export async function command(_argv: Record<string, unknown>): Promise<void> {
  done();
}

export const commandName = 'generate <recordingFile>';
export const describe = 'Generate a web player for a recording file';
export const handler = command;
