# env-ghosts

A simple Node.js CLI tool that identifies non-existent directory paths stored in your system's environment variables. It helps keep your environment clean and avoids errors caused by dangling path references.

## Features
- Scans environment variables containing multiple paths (e.g., `PATH`, `INCLUDE`, `LIB`).
- Scans environment variables pointing to a single directory (e.g., `HOME`, `JAVA_HOME`).
- Handles platform-specific path delimiters automatically.
- Generates a clear, actionable report.

## Usage

You can run this directly from the repository using `npx`:

```bash
npx https://github.com/kasajian/env-ghosts
```

Or run it locally after cloning:

```bash
node bin/cli.js
```

## Configuration

The list of environment variables to check is defined in `path_lists.json`.
