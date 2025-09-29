#!/bin/bash

# Deployment script for Activation app to AWS Fargate
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=${AWS_ACCOUNT_ID}
REPO_NAME="activation"
SERVICE_NAME="activation-service"
CLUSTER_NAME="activation-cluster"

if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID environment variable is required"
    exit 1
fi

echo "🚀 Deploying Activation to AWS Fargate..."
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Account ID: $ACCOUNT_ID"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t $REPO_NAME .

# Tag the image for ECR
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"
docker tag $REPO_NAME:latest $ECR_URI:latest

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Create ECR repository if it doesn't exist
echo "📋 Creating ECR repository if needed..."
aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION 2>/dev/null || \
aws ecr create-repository --repository-name $REPO_NAME --region $REGION

# Push the image
echo "⬆️ Pushing image to ECR..."
docker push $ECR_URI:latest

# Update task definition with current image
echo "📝 Updating task definition..."
sed "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g; s/YOUR_REGION/$REGION/g" aws-task-definition.json > task-definition-updated.json

# Register new task definition
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition-updated.json \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo "✅ Task definition registered: $TASK_DEFINITION_ARN"

# Update service
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $TASK_DEFINITION_ARN \
    --region $REGION \
    --query 'service.serviceArn' \
    --output text

echo "🎉 Deployment complete!"
echo "Service will be available at: https://exp-activation.klickcloud.net"

# Cleanup
rm -f task-definition-updated.json
