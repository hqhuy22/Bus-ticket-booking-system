# GitHub Secrets Configuration Guide

This document explains how to configure GitHub Secrets for the CI/CD pipelines.

## Required Secrets for Docker Build

To enable Docker image building and deployment, you need to configure the following secrets in your GitHub repository:

### Docker Hub Credentials

1. **DOCKER_USERNAME**
   - Your Docker Hub username
   - Example: `your-dockerhub-username`

2. **DOCKER_PASSWORD**
   - Your Docker Hub password or Personal Access Token (recommended)
   - How to create a Docker Hub Access Token:
     1. Go to https://hub.docker.com/settings/security
     2. Click "New Access Token"
     3. Give it a name (e.g., "github-actions")
     4. Copy the token and use it as DOCKER_PASSWORD

### How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Name: `DOCKER_USERNAME`
   - Value: Your Docker Hub username
   - Click **Add secret**
   
   - Name: `DOCKER_PASSWORD`
   - Value: Your Docker Hub access token
   - Click **Add secret**

## Optional Secrets for Deployment

These secrets are required only if you want to deploy to staging/production servers:

### Staging Environment
- `STAGING_HOST` - SSH host address
- `STAGING_USER` - SSH username
- `STAGING_SSH_KEY` - Private SSH key for authentication

### Production Environment
- `PRODUCTION_HOST` - SSH host address
- `PRODUCTION_USER` - SSH username
- `PRODUCTION_SSH_KEY` - Private SSH key for authentication
- `PRODUCTION_URL` - Production URL for health checks

## CI/CD Workflows

### 1. CI Test Workflow (`ci-test.yml`)
- **Trigger**: On every push and pull request
- **Purpose**: Run tests and linting
- **Requirements**: No secrets needed
- **Jobs**:
  - Test Backend
  - Test Frontend

### 2. Docker Build Workflow (`docker-ci-cd.yml`)
- **Trigger**: Manual or on Dockerfile changes
- **Purpose**: Build and push Docker images
- **Requirements**: DOCKER_USERNAME and DOCKER_PASSWORD
- **Jobs**:
  - Check credentials
  - Run tests
  - Build backend image
  - Build frontend image
  - Security scan
  - Deploy to staging (if develop branch)
  - Deploy to production (if main branch)

## Note

- If Docker credentials are not configured, the Docker build workflow will skip gracefully
- The CI test workflow will always run regardless of Docker credentials
- You can manually trigger the Docker build workflow from the Actions tab

## Alternative: GitHub Container Registry

If you don't want to use Docker Hub, you can use GitHub Container Registry (ghcr.io) instead:

1. No additional secrets needed (uses GITHUB_TOKEN)
2. Update the workflow to use `ghcr.io` instead of `docker.io`
3. Images will be stored in GitHub Packages

Example configuration:
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME_BACKEND: ghcr.io/${{ github.repository }}/backend
  IMAGE_NAME_FRONTEND: ghcr.io/${{ github.repository }}/frontend
```
