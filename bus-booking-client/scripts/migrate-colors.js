#!/usr/bin/env node

/**
 * Migration Script - Replace old colors with theme tokens
 * Run this script to automatically update color classes in JSX files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively get all files matching pattern
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Skip excluded directories
      if (
        !['node_modules', 'dist', 'build', 'theme', 'layout'].includes(file)
      ) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      // Only include JSX/JS files
      if (/\.(jsx|js|tsx|ts)$/.test(file)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Color mapping from old to new
const colorReplacements = [
  // Blue to Info
  { old: /bg-blue-500/g, new: 'bg-info-500' },
  { old: /bg-blue-600/g, new: 'bg-info-600' },
  { old: /bg-blue-700/g, new: 'bg-info-700' },
  { old: /bg-blue-800/g, new: 'bg-info-800' },
  { old: /hover:bg-blue-500/g, new: 'hover:bg-info-500' },
  { old: /hover:bg-blue-600/g, new: 'hover:bg-info-600' },
  { old: /hover:bg-blue-700/g, new: 'hover:bg-info-700' },
  { old: /text-blue-500/g, new: 'text-info-500' },
  { old: /text-blue-600/g, new: 'text-info-600' },
  { old: /text-blue-700/g, new: 'text-info-700' },
  { old: /text-blue-800/g, new: 'text-info-800' },
  { old: /border-blue-500/g, new: 'border-info-500' },

  // Green to Success
  { old: /bg-green-500/g, new: 'bg-success-500' },
  { old: /bg-green-600/g, new: 'bg-success-600' },
  { old: /bg-green-700/g, new: 'bg-success-700' },
  { old: /bg-green-800/g, new: 'bg-success-800' },
  { old: /hover:bg-green-500/g, new: 'hover:bg-success-500' },
  { old: /hover:bg-green-600/g, new: 'hover:bg-success-600' },
  { old: /hover:bg-green-700/g, new: 'hover:bg-success-700' },
  { old: /text-green-500/g, new: 'text-success-500' },
  { old: /text-green-600/g, new: 'text-success-600' },
  { old: /text-green-700/g, new: 'text-success-700' },
  { old: /border-green-500/g, new: 'border-success-500' },

  // Red to Error
  { old: /bg-red-500/g, new: 'bg-error-500' },
  { old: /bg-red-600/g, new: 'bg-error-600' },
  { old: /bg-red-700/g, new: 'bg-error-700' },
  { old: /hover:bg-red-500/g, new: 'hover:bg-error-500' },
  { old: /hover:bg-red-600/g, new: 'hover:bg-error-600' },
  { old: /text-red-500/g, new: 'text-error-500' },
  { old: /text-red-600/g, new: 'text-error-600' },
  { old: /border-red-500/g, new: 'border-error-500' },
];

// Files to process
const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply each replacement
    colorReplacements.forEach(({ old, new: newValue }) => {
      if (old.test(content)) {
        content = content.replace(old, newValue);
        modified = true;
      }
    });

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.relative(srcDir, filePath)}`);
      return 1;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  console.log('🔄 Starting color migration...\n');

  // Find all matching files
  const files = getAllFiles(srcDir);

  console.log(`📁 Found ${files.length} files to process\n`);

  let updatedCount = 0;

  // Process each file
  files.forEach(file => {
    updatedCount += processFile(file);
  });

  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Updated ${updatedCount} files`);
}

// Run the migration
main();

export { processFile, colorReplacements };
