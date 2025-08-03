# Development Guide

This section contains all the information needed for local development setup and daily workflows.

## Quick Links

- **[Local Setup](./local-setup.md)** - Complete setup instructions for local development
- **[Daily Workflows](./workflows.md)** - Common development commands and procedures
- **[Testing Standards](./testing-standards.md)** - TDD approach and testing requirements
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## Prerequisites

Before starting development, ensure you have:

- Docker Desktop
- Kind: `brew install kind`
- kubectl: `brew install kubectl`
- Node.js 22+

## Quick Start

1. Follow the [Local Setup](./local-setup.md) guide for complete project setup
2. Use [Daily Workflows](./workflows.md) for common development tasks
3. Refer to [Testing Standards](./testing-standards.md) when writing tests
4. Check [Troubleshooting](./troubleshooting.md) if you encounter issues

## Architecture Overview

After successful setup, you'll have:
- **Kind Kubernetes cluster** running locally
- **PostgreSQL database** with persistent storage and migrations applied
- **Express.js API** with comprehensive endpoints
- **Health checks** and monitoring endpoints
- **Production-ready patterns** with proper dependency management