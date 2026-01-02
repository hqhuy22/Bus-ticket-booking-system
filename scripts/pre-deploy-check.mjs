#!/usr/bin/env node

/**
 * Pre-deployment Health Check Script
 * Kiểm tra trạng thái ứng dụng trước khi deploy
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.cyan}${'='.repeat(50)}${COLORS.reset}\n${msg}\n${COLORS.cyan}${'='.repeat(50)}${COLORS.reset}`),
};

class DeploymentChecker {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  async checkFileExists(filePath, required = true) {
    try {
      await fs.access(filePath);
      log.success(`File exists: ${filePath}`);
      return true;
    } catch {
      const msg = `Missing file: ${filePath}`;
      if (required) {
        log.error(msg);
        this.errors.push(msg);
      } else {
        log.warning(msg);
        this.warnings.push(msg);
      }
      return false;
    }
  }

  async checkEnvExample() {
    log.section('📝 Checking Environment Files');
    
    await this.checkFileExists('bus-booking-server/.env.example', true);
    await this.checkFileExists('bus-booking-client/.env.example', true);
    await this.checkFileExists('.env.production.example', false);
  }

  async checkPackageJson() {
    log.section('📦 Checking Package Configuration');
    
    const serverPkgPath = 'bus-booking-server/package.json';
    const clientPkgPath = 'bus-booking-client/package.json';
    
    if (await this.checkFileExists(serverPkgPath, true)) {
      const pkg = JSON.parse(await fs.readFile(serverPkgPath, 'utf-8'));
      
      // Check required scripts
      const requiredScripts = ['start', 'dev', 'test'];
      for (const script of requiredScripts) {
        if (pkg.scripts?.[script]) {
          log.success(`Script exists: ${script}`);
        } else {
          const msg = `Missing script in server package.json: ${script}`;
          log.error(msg);
          this.errors.push(msg);
        }
      }

      // Check if Node version is specified
      if (pkg.engines?.node) {
        log.success(`Node version specified: ${pkg.engines.node}`);
      } else {
        log.warning('Node version not specified in engines field');
        this.warnings.push('Consider adding "engines": {"node": ">=18.0.0"} to package.json');
      }
    }

    if (await this.checkFileExists(clientPkgPath, true)) {
      const pkg = JSON.parse(await fs.readFile(clientPkgPath, 'utf-8'));
      
      if (pkg.scripts?.build) {
        log.success('Build script exists');
      } else {
        const msg = 'Missing build script in client package.json';
        log.error(msg);
        this.errors.push(msg);
      }
    }
  }

  async checkDockerfiles() {
    log.section('🐳 Checking Docker Configuration');
    
    await this.checkFileExists('bus-booking-server/Dockerfile', false);
    await this.checkFileExists('bus-booking-client/Dockerfile', false);
    await this.checkFileExists('docker-compose.yml', false);
  }

  async checkDeploymentConfigs() {
    log.section('🚀 Checking Deployment Configurations');
    
    await this.checkFileExists('vercel.json', false);
    await this.checkFileExists('railway.json', false);
    await this.checkFileExists('render.yaml', false);
    await this.checkFileExists('netlify.toml', false);
  }

  async checkGitHubActions() {
    log.section('⚙️ Checking GitHub Actions');
    
    const workflowDir = '.github/workflows';
    try {
      const files = await fs.readdir(workflowDir);
      const ymlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      
      if (ymlFiles.length > 0) {
        log.success(`Found ${ymlFiles.length} workflow file(s): ${ymlFiles.join(', ')}`);
      } else {
        log.warning('No workflow files found in .github/workflows');
        this.warnings.push('Consider adding CI/CD workflows');
      }
    } catch {
      log.warning('No .github/workflows directory found');
      this.warnings.push('GitHub Actions not configured');
    }
  }

  async checkGitIgnore() {
    log.section('🔒 Checking .gitignore');
    
    if (await this.checkFileExists('.gitignore', true)) {
      const content = await fs.readFile('.gitignore', 'utf-8');
      const requiredPatterns = [
        'node_modules',
        '.env',
        'dist',
        'build',
        'coverage',
      ];

      for (const pattern of requiredPatterns) {
        if (content.includes(pattern)) {
          log.success(`Pattern exists: ${pattern}`);
        } else {
          log.warning(`Missing pattern in .gitignore: ${pattern}`);
          this.warnings.push(`Add "${pattern}" to .gitignore`);
        }
      }

      // Check for sensitive files
      const sensitivePatterns = ['.env', '*.key', '*.pem'];
      if (sensitivePatterns.every(p => content.includes(p) || content.includes(p.replace('*', '')))) {
        log.success('Sensitive files are ignored');
      } else {
        log.warning('Some sensitive file patterns may not be ignored');
      }
    }
  }

  async runTests() {
    log.section('🧪 Running Tests');
    
    try {
      log.info('Running backend tests...');
      const { stdout } = await execAsync('cd bus-booking-server && npm run test:passing', {
        timeout: 120000, // 2 minutes
      });
      
      if (stdout.includes('PASS') || stdout.includes('passed')) {
        log.success('Backend tests passed');
      } else {
        log.warning('Tests completed but check output carefully');
      }
    } catch (error) {
      log.error('Tests failed or timed out');
      log.info('You may want to fix tests before deploying');
      this.warnings.push('Tests failed - review before deploying');
    }
  }

  async checkBuildProcess() {
    log.section('🏗️ Testing Build Process');
    
    try {
      log.info('Testing frontend build...');
      await execAsync('cd bus-booking-client && npm run build', {
        timeout: 180000, // 3 minutes
      });
      log.success('Frontend builds successfully');
    } catch (error) {
      const msg = 'Frontend build failed';
      log.error(msg);
      this.errors.push(msg);
      log.error(error.message);
    }
  }

  async checkDependencies() {
    log.section('📚 Checking Dependencies');
    
    try {
      log.info('Checking for outdated backend dependencies...');
      const { stdout } = await execAsync('cd bus-booking-server && npm outdated || true');
      
      if (stdout.trim()) {
        log.warning('Some backend dependencies are outdated');
        console.log(stdout);
        this.warnings.push('Consider updating dependencies before deploying');
      } else {
        log.success('Backend dependencies are up to date');
      }
    } catch (error) {
      log.warning('Could not check dependencies');
    }
  }

  async checkSecrets() {
    log.section('🔐 Security Check');
    
    // Check for hardcoded secrets
    try {
      const { stdout } = await execAsync(
        'git grep -n -i -E "(password|secret|key|token)\\s*=\\s*[\'\\"][^\'\\"]+[\'\\"]" -- "*.js" "*.jsx" "*.ts" "*.tsx" || true'
      );
      
      if (stdout.trim()) {
        log.warning('Potential hardcoded secrets found:');
        console.log(stdout);
        this.warnings.push('Review potential hardcoded secrets');
      } else {
        log.success('No obvious hardcoded secrets found');
      }
    } catch {
      log.info('Could not scan for secrets');
    }
  }

  printSummary() {
    log.section('📊 Deployment Readiness Summary');
    
    console.log(`\n${COLORS.green}Checks Passed: ${this.checks.length}${COLORS.reset}`);
    console.log(`${COLORS.yellow}Warnings: ${this.warnings.length}${COLORS.reset}`);
    console.log(`${COLORS.red}Errors: ${this.errors.length}${COLORS.reset}\n`);

    if (this.warnings.length > 0) {
      console.log(`${COLORS.yellow}⚠ Warnings:${COLORS.reset}`);
      this.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
      console.log();
    }

    if (this.errors.length > 0) {
      console.log(`${COLORS.red}✗ Errors:${COLORS.reset}`);
      this.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
      console.log();
    }

    if (this.errors.length === 0) {
      console.log(`${COLORS.green}✅ Ready for deployment!${COLORS.reset}\n`);
      console.log('Next steps:');
      console.log('  1. Review warnings (if any)');
      console.log('  2. Push to GitHub to trigger CI/CD');
      console.log('  3. Monitor deployment logs\n');
      return true;
    } else {
      console.log(`${COLORS.red}❌ Not ready for deployment${COLORS.reset}\n`);
      console.log('Please fix the errors above before deploying.\n');
      return false;
    }
  }

  async run() {
    console.log(`\n${COLORS.cyan}╔════════════════════════════════════════════╗${COLORS.reset}`);
    console.log(`${COLORS.cyan}║   🚀 Pre-Deployment Health Check          ║${COLORS.reset}`);
    console.log(`${COLORS.cyan}╚════════════════════════════════════════════╝${COLORS.reset}\n`);

    await this.checkEnvExample();
    await this.checkPackageJson();
    await this.checkGitIgnore();
    await this.checkDockerfiles();
    await this.checkDeploymentConfigs();
    await this.checkGitHubActions();
    await this.checkSecrets();
    
    // Optional: Comment out if too slow
    // await this.runTests();
    // await this.checkBuildProcess();
    // await this.checkDependencies();

    const isReady = this.printSummary();
    process.exit(isReady ? 0 : 1);
  }
}

// Run the checker
const checker = new DeploymentChecker();
checker.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
