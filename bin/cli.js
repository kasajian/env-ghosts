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

const multiPathVars = config.multi_path_vars || [];
const singlePathVars = config.single_path_vars || [];

const dirMissing = {};
const dirEmpty = {};
const fileMissing = [];
const fileEmpty = [];

// 2. Scan multi_path_vars (lists of folders)
multiPathVars.forEach(({ envvar }) => {
  const value = process.env[envvar];
  if (!value) return;

  const parts = value.split(path.delimiter);
  const missing = [];
  const empty = [];

  parts.forEach(p => {
    if (!p) return;
    // Skip node_modules/.bin paths that are often injected by npm/node and may not exist yet
    if (p.toLowerCase().endsWith(path.join('node_modules', '.bin').toLowerCase())) return;
    
    if (!fs.existsSync(p)) {
      missing.push(p);
    } else {
      try {
        const files = fs.readdirSync(p);
        if (files.length === 0) {
          empty.push(p);
        }
      } catch (err) {
        // If we can't read the directory (e.g. permission denied), we don't count it as empty
      }
    }
  });

  if (missing.length > 0) {
    dirMissing[envvar] = missing;
  }
  if (empty.length > 0) {
    dirEmpty[envvar] = empty;
  }
});

// 3. Scan single_path_vars (single folder)
singlePathVars.forEach(({ envvar }) => {
  const value = process.env[envvar];
  if (!value) return;

  if (!fs.existsSync(value)) {
    fileMissing.push(envvar);
  } else {
    try {
      const files = fs.readdirSync(value);
      if (files.length === 0) {
        fileEmpty.push(envvar);
      }
    } catch (err) {
      // Permission issues etc.
    }
  }
});

// 4. Reporting
let hasIssues = false;

// Report for dir_paths - Missing
Object.entries(dirMissing).forEach(([envvar, missing]) => {
  hasIssues = true;
  console.log(`\nFolders listed in the environment variable ${envvar} that do not exist on the system:`);
  missing.forEach(p => console.log(`  - ${p}`));
});

// Report for dir_paths - Empty
Object.entries(dirEmpty).forEach(([envvar, empty]) => {
  hasIssues = true;
  console.log(`\nFolders listed in the environment variable ${envvar} that exist but are EMPTY:`);
  empty.forEach(p => console.log(`  - ${p}`));
});

// Report for file_paths - Missing
if (fileMissing.length > 0) {
  hasIssues = true;
  console.log(`\nThe following environment variables point to paths that do NOT exist on this system:`);
  fileMissing.forEach(envvar => console.log(`  - ${envvar} (${process.env[envvar]})`));
}

// Report for file_paths - Empty
if (fileEmpty.length > 0) {
  hasIssues = true;
  console.log(`\nThe following environment variables point to paths that exist but are EMPTY:`);
  fileEmpty.forEach(envvar => console.log(`  - ${envvar} (${process.env[envvar]})`));
}

if (!hasIssues) {
  console.log("All environment variable paths exist and are non-empty.");
}
