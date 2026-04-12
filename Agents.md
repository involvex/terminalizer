# Agents.md - AI Agent Instructions for Terminalizer

> Instructions for AI agents working on the Terminalizer project

## Table of Contents

- [Useful Commands](#useful-commands)
- [Technologies](#technologies)
- [Best Practices and Guidelines](#best-practices-and-guidelines)

---

## Useful Commands

### Development Commands

```bash
# Install dependencies
bun install

# Type checking (strict TypeScript checking)
bun run typecheck

# Linting with ESLint
bun run lint

# Build the project (webpack)
bun run build

# Start in interactive mode
bun bin/app.ts

# Run a specific command
bun bin/app.ts record demo
bun bin/app.ts play demo
bun bin/app.ts render demo
```

### Available CLI Commands

| Command | Description |
|---------|-------------|
| `terminalizer init` | Create a global config directory |
| `terminalizer config` | Generate a config file in the current directory |
| `terminalizer record <file>` | Record your terminal and create a recording file |
| `terminalizer play <file>` | Play a recording file on your terminal |
| `terminalizer render <file>` | Render a recording file as an animated GIF |
| `terminalizer share <file>` | Upload a recording file and get a link for an online player |
| `terminalizer generate <file>` | Generate a web player for a recording file |

### NPM Scripts Reference

```json
{
  "dev": "NODE_ENV=development bunx webpack --watch --config webpack.config.cjs",
  "build": "bun run typecheck && NODE_ENV=production bunx webpack --progress --config webpack.config.cjs",
  "typecheck": "bun run tsc --noEmit",
  "lint": "bun run eslint . --config eslint.config.cjs",
  "start": "bun run bin/app.ts"
}
```

---

## Technologies

### Core Runtime

- **Bun** - JavaScript runtime and package manager (primary)
- **Node.js** - JavaScript runtime (fallback)
- **TypeScript** - Type-safe JavaScript superset

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@homebridge/node-pty-prebuilt-multiarch` | Pseudo-terminal (PTY) for terminal recording |
| `@xterm/xterm` | Terminal emulator for playback |
| `gif-encoder` | GIF image encoding |
| `pngjs` | PNG image processing |
| `js-yaml` | YAML configuration parsing |
| `chalk` | Terminal string styling |
| `inquirer` | Interactive CLI prompts |
| `yargs` | Command-line argument parsing |
| `electron` | Desktop terminal emulation |
| `axios` | HTTP requests for sharing |
| `lodash` | Utility functions |
| `fs-extra` | Enhanced file system operations |

### Build Tools

- **webpack** - Module bundler
- **TypeScript** - Language compiler
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Project Structure

```
terminalizer/
├── bin/           # Entry points
│   ├── app.ts     # Main CLI entry
│   └── cli.ts     # Interactive CLI
├── commands/      # CLI command implementations
│   ├── init.ts
│   ├── config.ts
│   ├── record.ts
│   ├── play.ts
│   ├── render.ts
│   ├── share.ts
│   └── generate.ts
├── src/           # Source code
├── lib/           # Library modules
├── dist/          # Built output
├── render/        # Web player renderer
└── package.json   # Project configuration
```

### Configuration Files

- `tsconfig.json` - TypeScript configuration
- `webpack.config.cjs` - Webpack bundler configuration
- `eslint.config.cjs` - ESLint linting rules
- `config.yml` - Default terminalizer configuration

---

## Best Practices and Guidelines

### TypeScript Development

1. **Strict Type Checking**
   - Always run `bun run typecheck` before committing
   - Enable strict mode in TypeScript configurations
   - Avoid using `any` type when possible

2. **Type Definitions**
   - Use proper TypeScript types for all function parameters and return values
   - Leverage the `@types/` packages for type definitions

3. **Module Resolution**
   - Use ES modules (`"type": "module"` in package.json)
   - Configure `moduleResolution: "bundler"` in tsconfig.json

### Code Quality

1. **Linting**
   - Run `bun run lint` before submitting code
   - Follow ESLint configuration rules
   - Use Prettier for code formatting

2. **Best Practices**
   - Use descriptive variable and function names
   - Keep functions small and focused
   - Document complex logic with comments
   - Handle errors gracefully with proper error messages

### Project Conventions

1. **File Naming**
   - TypeScript files: `*.ts`
   - Configuration: `*.yml` or `*.yaml`
   - Entry points in `bin/` directory

2. **Configuration Handling**
   - Use YAML for user configuration files
   - Support both global (`terminalizer init`) and local (`-c config.yml`) configs
   - Use deep merging for configuration override

3. **Terminal Compatibility**
   - Support Linux (`bash`), macOS, and Windows (`powershell.exe`)
   - Consider ZSH support for Linux
   - Handle different cursor styles (block, underline, bar)

### Performance Considerations

1. **Build Optimization**
   - Use webpack for production builds
   - Enable tree shaking and code splitting
   - Minimize bundle size

2. **Recording Optimization**
   - Allow frame skipping with step values
   - Support configurable frame delays
   - Implement max idle time limiting

3. **GIF Rendering**
   - Allow quality configuration (1-100)
   - Support frame step reduction
   - Implement efficient image encoding

### Security

1. **Command Execution**
   - Sanitize user input for command execution
   - Never execute untrusted code
   - Use spawn with explicit arguments

2. **File Operations**
   - Validate file paths before reading/writing
   - Use `fs-extra` for safe file operations
   - Handle permission errors gracefully

### Testing Guidelines

1. **Manual Testing**
   - Test each CLI command locally
   - Verify cross-platform compatibility
   - Test with various terminal configurations

2. **Interactive Mode**
   - Test arrow-key navigation
   - Verify all menu options work correctly

### Contributing Guidelines

1. **Getting Started**
   - Run `bun install` after cloning
   - Run `bun run typecheck` to verify TypeScript
   - Run `bun run lint` to verify code style

2. **Making Changes**
   - Make small, focused changes
   - Test locally before submitting
   - Follow existing code patterns

3. **Documentation**
   - Update README.md for user-facing changes
   - Add comments for complex logic
   - Keep configuration examples up to date

### Platform-Specific Notes

1. **Windows**
   - Default shell: `powershell.exe`
   - Config directory: `%APPDATA%`
   - May require additional build tools for native modules

2. **Linux/macOS**
   - Default shell: `bash` (or `zsh` on macOS)
   - Config directory: `~/config/terminalizer`
   - May require `libXScrnSaver` or similar system libraries

---

## Quick Reference

### Development Workflow

```bash
# 1. Install dependencies
bun install

# 2. Make code changes
# Edit source files in commands/, bin/, or lib/

# 3. Verify code quality
bun run typecheck
bun run lint

# 4. Build and test
bun run build
bun bin/app.ts <command>
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `libXss.so.1` missing | `sudo yum install libXScrnSaver` or `sudo apt-get install libxss-dev` |
| `libgconf-2.so.4` missing | `sudo apt-get install libgconf-2-4` |
| Permission denied | Check npm global directory permissions |
| Type errors | Run `bun run typecheck` to see all errors |

---

## Additional Resources

- [Terminalizer Website](https://www.terminalizer.com)
- [GitHub Repository](https://github.com/faressoft/terminalizer)
- [npm Package](https://www.npmjs.com/package/terminalizer)

---

*Last updated: 2026-04-12*