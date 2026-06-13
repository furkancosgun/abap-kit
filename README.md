# abap-kit

A lightweight CLI tool for scaffolding ABAP development projects quickly.

## Features

- Creates a complete ABAP project structure in seconds
- Generates a starter ABAP program
- Sets up abaplint and transpiler configuration
- Adds VS Code recommendations for ABAP development
- Creates a ready-to-use README and project skeleton

## Installation

Install globally with npm:

```bash
npm install -g abap-kit
```

## Usage

Create a new project:

```bash
abap-kit create my-abap-project
```

Then run:

```bash
cd my-abap-project
npm run exec
```

## Commands

- `abap-kit create <project-name>` – Create a new project
- `abap-kit --help` – Show help
- `abap-kit --version` – Show installed version

## Project Structure

The generated project includes:

- `src/` for ABAP source files
- `setup.mjs` for runtime setup
- `abaplint-transpiler.json` for transpilation config
- `abaplint.json` for linting config
- `.vscode/extensions.json` for editor recommendations

## CI

When you run the CLI with the CI option, it generates a GitHub Actions workflow for the created project.

Example:

```bash
abap-kit create my-abap-project --ci
```

This creates a workflow file at:

- `.github/workflows/lint.yml`

The generated workflow runs on pushes and pull requests to the `main` branch and executes:

- `npm install`
- `npm run lint`
- `npm run unit`

This repository itself does not contain a dedicated CI workflow.

## License

MIT
