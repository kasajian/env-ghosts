#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for the script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../path_lists.json');

// 1. Load the configuration
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error(`Error reading path_lists.json: ${err.message}`);
  process.exit(1);
}

const dirPaths = config.dir_paths || [];
const filePaths = config.file_paths || [];

const dirErrors = {};
const fileErrors = [];

// 2. Scan dir_paths (lists of folders)
dirPaths.forEach(({ envvar }) => {
  const value = process.env[envvar];
  if (!value) return;

  const parts = value.split(path.delimiter);
  const missing = parts.filter(p => p && !fs.existsSync(p));

  if (missing.length > 0) {
    dirErrors[envvar] = missing;
  }
});

// 3. Scan file_paths (single folder)
filePaths.forEach(({ envvar }) => {
  const value = process.env[envvar];
  if (!value) return;

  if (!fs.existsSync(value)) {
    fileErrors.push(envvar);
  }
});

// 4. Reporting
let hasErrors = false;

// Report for dir_paths
Object.entries(dirErrors).forEach(([envvar, missing]) => {
  hasErrors = true;
  console.log(`\nFolders listed in the environment variable ${envvar} that do not exist on the system:`);
  missing.forEach(p => console.log(`  - ${p}`));
});

// Report for file_paths
if (fileErrors.length > 0) {
  hasErrors = true;
  console.log(`\nThe following environment variables point to paths that do not exist on this system:`);
  fileErrors.forEach(envvar => console.log(`  - ${envvar} (${process.env[envvar]})`));
}

if (!hasErrors) {
  console.log("All environment variable paths exist on this system.");
}
