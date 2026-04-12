import { type ConfigData } from './src/types/global.js';

export function isFile(filePath: string): boolean {
  const resolvedPath = di.path.resolve(filePath);
  try {
    return di.fs.statSync(resolvedPath).isFile();
  } catch {
    return false;
  }
}

export function isDir(dirPath: string): boolean {
  const resolvedPath = di.path.resolve(dirPath);
  try {
    return di.fs.statSync(resolvedPath).isDirectory();
  } catch {
    return false;
  }
}

export function loadFile(filePath: string, extension: string): string {
  const resolvedPath = resolveFilePath(filePath, extension);

  if (!isFile(resolvedPath)) {
    throw new Error('The provided file doesn\'t exit');
  }

  try {
    return di.fs.readFileSync(resolvedPath, 'utf8') as string;
  } catch (error) {
    throw new Error(String(error));
  }
}

export function loadYAML(filePath: string): ConfigData {
  const file = loadFile(filePath, 'yml');
  try {
    return {
      json: di.yaml.load(file) as Record<string, unknown>,
      raw: file,
    };
  } catch {
    throw new Error('The provided file is not a valid YAML file');
  }
}

export function loadJSON(filePath: string): Record<string, unknown> {
  const file = loadFile(filePath, 'json');
  try {
    return JSON.parse(file as string);
  } catch {
    throw new Error('The provided file is not a valid JSON file');
  }
}

export function resolveFilePath(filePath: string, extension: string): string {
  const resolvedPath = di.path.resolve(filePath);
  const currentExt = di.path.extname(resolvedPath);
  if (currentExt !== `.${extension}`) {
    return `${resolvedPath}.${extension}`;
  }
  return resolvedPath;
}

export function getDefaultConfig(): ConfigData {
  const defaultConfigPath = di.path.join(ROOT_PATH, 'config.yml');
  const globalConfigPath = di.path.join(getGlobalDirectory(), 'config.yml');

  if (isFile(globalConfigPath)) {
    return loadYAML(globalConfigPath);
  }

  return loadYAML(defaultConfigPath);
}

export function changeYAMLValue(data: ConfigData, key: string, value: unknown): void {
  data.json[key] = value;
  data.raw = data.raw.replace(new RegExp(`^${key}:.+$`, 'm'), `${key}: ${value}`);
}

export function getGlobalDirectory(): string {
  if (process.env.APPDATA) {
    return di.path.join(process.env.APPDATA, 'terminalizer');
  }
  return di.path.join(process.env.HOME ?? '', '.config/terminalizer');
}

export function isGlobalDirectoryCreated(): boolean {
  return isDir(getGlobalDirectory());
}

export function generateToken(): string {
  const token = di.uuid.v4() as string;
  const globalDirPath = getGlobalDirectory();
  const tokenPath = di.path.join(globalDirPath, 'token.txt');
  di.fs.writeFileSync(tokenPath, token, 'utf8');
  return token;
}

export function getToken(): string | null {
  const globalDirPath = getGlobalDirectory();
  const tokenPath = di.path.join(globalDirPath, 'token.txt');

  if (!isFile(tokenPath)) {
    return null;
  }

  return di.fs.readFileSync(tokenPath, 'utf8') as string;
}

export function removeToken(): void {
  const globalDirPath = getGlobalDirectory();
  const tokenPath = di.path.join(globalDirPath, 'token.txt');

  if (isFile(tokenPath)) {
    di.fs.unlinkSync(tokenPath);
  }
}

export function getOS(): 'mac' | 'windows' | 'linux' {
  const platform = di.os.platform();
  if (platform === 'darwin') return 'mac';
  if (platform === 'win32') return 'windows';
  return 'linux';
}
