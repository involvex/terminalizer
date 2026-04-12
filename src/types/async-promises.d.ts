declare module 'async-promises' {
  const waterfall: (tasks: unknown[], callback: (err: Error, result: unknown) => void) => void;
  export = { waterfall };
}
