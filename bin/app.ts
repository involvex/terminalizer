#!/usr/bin/env node

if (process.argv.length === 2) {
  import('./cli.js').then(({ startInteractiveMode }) => {
    startInteractiveMode();
  });
} else {
  import('../app.js').then(() => {});
}
