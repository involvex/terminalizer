import path from 'path';
import camelCase from 'lodash/camelCase.js';

export class DIGraph {
  private _dependencies: Record<string, unknown> = {};
  private _proxy: unknown;

  constructor() {
    this._proxy = new Proxy(this, {
      get: this.getHandler.bind(this),
      set: this.setHandler.bind(this),
    });
  }

  public getProxy(): unknown {
    return this._proxy;
  }

  private getHandler(_target: DIGraph, key: string): unknown {
    if (key in this) {
      return (this as Record<string, unknown>)[key];
    }
    if (key in this._dependencies) {
      return this._dependencies[key];
    }
    return undefined;
  }

  private setHandler(_target: DIGraph, key: string, value: unknown): boolean {
    if (key in this) {
      throw new Error(`It is not allowed to set '${key}'`);
    }
    this._dependencies[key] = value;
    return true;
  }

  public async require(moduleName: string, key?: string): Promise<void> {
    const parsedModuleName = path.parse(moduleName);
    const resolvedKey = key ?? camelCase(parsedModuleName.name);

    let resolvedModuleName = moduleName;

    if (parsedModuleName.dir !== '') {
      resolvedModuleName = path.resolve(this._getAppRootPath(), moduleName);
    }

    const module = await import(resolvedModuleName);
    this._dependencies[resolvedKey] = module.default || module;
  }

  public set(key: string, value: unknown): void {
    this._dependencies[key] = value;
  }

  public get(key: string): unknown {
    return this._dependencies[key];
  }

  private _getAppRootPath(): string {
    return process.cwd();
  }
}
