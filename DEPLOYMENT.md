# Activation - Deployment Guide

This guide covers deploying the Activation Contact Visualizer to AWS Fargate.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed
- Node.js 18+ for local development

## Environment Variables

The application requires the following environment variables:

### Required
- `VITE_AUTH_USERNAME` - Username for basic authentication (default: admin)
- `VITE_AUTH_PASSWORD` - Password for basic authentication (default: activation2024)

### Data Configuration
- `VITE_DATA_SOURCE` - Data source type: `github`, `s3`, `googleDrive`, or `cdn` (default: github)
- `VITE_DEFAULT_MASTER_CSV` - URL to the master CSV file (default: GitHub Raw URL)

### Optional
- `VITE_ANTHROPIC_API_KEY` - API key for Anthropic services
- `VITE_APP_NAME` - Application name (default: Activation)
- `VITE_APP_VERSION` - Application version (default: 1.0.0)

## Data Hosting Setup

The application requires CSV data files to be hosted remotely. Choose one of these options:

### Option 1: GitHub (Free, Easy)
```bash
# Upload your CSV files to GitHub
./upload-data-to-github.sh
```

### Option 2: AWS S3 (Recommended for Production)
```bash
# Upload your CSV files to S3
./upload-data-to-s3.sh
```

### Option 3: Google Drive (Easy Updates)
1. Upload CSV files to Google Drive
2. Get shareable links
3. Update the file IDs in `src/lib/dataHosting.ts`

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Test with Docker:**
   ```bash
   docker-compose up --build
   ```

## AWS Fargate Deployment

### 1. Prerequisites Setup

Create the following AWS resources:

- ECS Cluster: `activation-cluster`
- ECS Service: `activation-service`
- ECR Repository: `activation`
- Application Load Balancer
- Route 53 hosted zone for `klickcloud.net`

### 2. Environment Variables

Set the following environment variables:

```bash
export AWS_ACCOUNT_ID=your-account-id
export AWS_REGION=us-east-1
```

### 3. Deploy

Run the deployment script:

```bash
./deploy.sh production
```

### 4. Manual Deployment Steps

If you prefer manual deployment:

1. **Build and push Docker image:**
   ```bash
   docker build -t activation .
   docker tag activation:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/activation:latest
   aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
   docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/activation:latest
   ```

2. **Update task definition:**
   ```bash
   # Edit aws-task-definition.json with your account ID and region
   aws ecs register-task-definition --cli-input-json file://aws-task-definition.json
   ```

3. **Update ECS service:**
   ```bash
   aws ecs update-service --cluster activation-cluster --service activation-service --task-definition activation
   ```

## Security

### Authentication
- Basic authentication is implemented with username/password
- Session persists for 24 hours
- Credentials are configurable via environment variables

### Secrets Management
- API keys should be stored in AWS Secrets Manager
- Update the task definition to reference secrets ARN

### Network Security
- Application runs on port 80 internally
- Use Application Load Balancer for HTTPS termination
- Configure security groups to restrict access

## Monitoring

### Health Checks
- Application provides `/health` endpoint
- ECS health checks configured in task definition
- Load balancer health checks should point to `/health`

### Logging
- Application logs to stdout/stderr
- ECS CloudWatch integration configured
- Log group: `/ecs/activation`

## Troubleshooting

### Common Issues

1. **Container fails to start:**
   - Check environment variables
   - Verify ECR image exists
   - Check CloudWatch logs

2. **Authentication not working:**
   - Verify `VITE_AUTH_USERNAME` and `VITE_AUTH_PASSWORD` are set
   - Check browser console for errors

3. **Performance issues:**
   - Monitor ECS service metrics
   - Consider increasing CPU/memory allocation
   - Check application logs for errors

### Useful Commands

```bash
# Check service status
aws ecs describe-services --cluster activation-cluster --services activation-service

# View logs
aws logs tail /ecs/activation --follow

# Scale service
aws ecs update-service --cluster activation-cluster --service activation-service --desired-count 2
```

## URL Structure

The application will be available at:
- Production: `https://exp-activation.klickcloud.net`
- Health check: `https://exp-activation.klickcloud.net/health`

## Support

For deployment issues, check:
1. AWS CloudWatch logs
2. ECS service events
3. Application health endpoint
4. Load balancer target health
