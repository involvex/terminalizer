/// <reference types="bun-types" />
/// <reference types="node" />

export interface DI {
  require: (moduleName: string, key?: string) => void;
  set: (key: string, value: unknown) => void;
  get: (key: string) => unknown;
  path: typeof import('path');
  os: typeof import('os');
  chalk: {
    green: (s: string) => string;
    magenta: (s: string) => string;
    dim: (s: string) => string;
    yellow: (s: string) => string;
    cyan: (s: string) => string;
    gray: (s: string) => string;
  };
  axios: (options: unknown) => Promise<{ status: number; data: { url?: string; errors?: string[] } }>;
  electron: string;
  deepmerge: (a: unknown, b: unknown) => unknown;
  uuid: { v4: () => string };
  tmp: { dirSync: (opts: { unsafeCleanup: boolean }) => { name: string } };
  _: typeof import('lodash');
  fs: typeof import('fs-extra');
  yaml: { load: (s: string) => unknown; dump: (o: unknown) => string };
  now: () => number;
  asyncPromises: typeof import('async-promises');
  async: typeof import('async');
  stringArgv: (str: string) => string[];
  ProgressBar: new (
    template: string,
    options: { width: number; total: number },
  ) => { tick: () => void; complete: boolean };
  GIFEncoder: new (
    width: number,
    height: number,
    options?: unknown,
  ) => {
    pipe: (w: unknown) => void;
    setQuality: (n: number) => void;
    setRepeat: (n: number) => void;
    writeHeader: () => void;
    setDelay: (n: number) => void;
    addFrame: (data: Uint8Array) => void;
    finish: () => void;
  };
  inquirer: { prompt: (questions: unknown[]) => Promise<Record<string, unknown>> };
  death: (callback: () => void) => void;
  pty: typeof import('@homebridge/node-pty-prebuilt-multiarch');
  PNG: new () => {
    parse: (
      data: Buffer,
      cb: (err: Error | null, data: { width: number; height: number; data: Uint8Array }) => void,
    ) => void;
  };
  spawn: (
    cmd: string,
    args: string[],
    opts: unknown,
  ) => {
    stdout: { on: (event: string, cb: (data: Buffer) => void) => void };
    stderr: { on: (event: string, cb: (data: Buffer) => void) => void };
    on: (event: string, cb: (code: number) => void) => void;
    kill: () => void;
  };
  utility: {
    loadYAML: (filePath: string) => ConfigData;
    loadJSON: (filePath: string) => Record<string, unknown>;
    resolveFilePath: (filePath: string, extension: string) => string;
    getDefaultConfig: () => ConfigData;
    changeYAMLValue: (data: ConfigData, key: string, value: unknown) => void;
    getGlobalDirectory: () => string;
    isGlobalDirectoryCreated: () => boolean;
    generateToken: () => string;
    getToken: () => string | null;
    removeToken: () => void;
    getOS: () => 'mac' | 'windows' | 'linux';
  };
  commands: Record<string, CommandModule>;
  errorHandler: (error: string | Error) => void;
}

export interface CommandModule {
  commandName: string;
  describe: string;
  handler: (argv: Record<string, unknown>) => void | Promise<void>;
  builder?: (yargs: unknown) => unknown;
  adjustFramesDelays?: (records: Array<{ content: string; delay: number }>, options: Record<string, unknown>) => void;
}

export interface ConfigData {
  json: Record<string, unknown>;
  raw: string;
}

declare global {
  const di: DI;
  const ROOT_PATH: string;
  const BASEURL: string;
}
