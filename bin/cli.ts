import inquirer from 'inquirer';
import chalk from 'chalk';
import '../app.js';

interface CommandChoice {
  name: string;
  description: string;
  value: string;
}

const commands: CommandChoice[] = [
  { name: 'init', description: 'Create a global config directory', value: 'init' },
  { name: 'config', description: 'Edit the configuration file', value: 'config' },
  { name: 'record', description: 'Record your terminal', value: 'record' },
  { name: 'play', description: 'Play a recording file', value: 'play' },
  { name: 'render', description: 'Render a recording as GIF', value: 'render' },
  { name: 'share', description: 'Upload and share recording', value: 'share' },
  { name: 'generate', description: 'Generate a web player', value: 'generate' },
];

function listCommands(): void {
  console.log(chalk.bold('\nAvailable commands:\n'));
  commands.forEach((cmd) => {
    console.log(`  ${chalk.cyan(cmd.name)} - ${cmd.description}`);
  });
  console.log('');
}

async function selectCommand(): Promise<string> {
  const answer = await inquirer.prompt({
    type: 'list',
    name: 'command',
    message: 'Select a command:',
    choices: commands.map((cmd) => ({
      name: `${cmd.name} - ${cmd.description}`,
      value: cmd.value,
    })),
  });
  return answer.command;
}

async function runCommand(commandName: string): Promise<void> {
  const { startYargs } = await import('../app.js');

  const commandArgs = process.argv.slice(2);
  process.argv = [process.argv[0], commandName, ...commandArgs];

  startYargs();
}

export async function startInteractiveMode(): Promise<void> {
  console.log(chalk.cyan('Welcome to Terminalizer!'));
  listCommands();

  const selectedCommand = await selectCommand();
  console.log(chalk.yellow(`\nSelected: ${selectedCommand}\n`));

  await runCommand(selectedCommand);
}
