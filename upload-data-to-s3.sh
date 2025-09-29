#!/bin/bash

# Script to upload CSV data files to AWS S3 for production hosting
# This provides secure, scalable hosting with CDN capabilities

set -e

# Configuration
BUCKET_NAME="activation-data"
REGION="us-east-1"
PROFILE="default"  # AWS profile to use

echo "🚀 Uploading data files to AWS S3..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   brew install awscli  # macOS"
    echo "   or visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity --profile "$PROFILE" &> /dev/null; then
    echo "🔐 Please configure AWS credentials:"
    echo "   aws configure --profile $PROFILE"
    exit 1
fi

# Create S3 bucket if it doesn't exist
echo "📁 Creating S3 bucket..."
if ! aws s3 ls "s3://$BUCKET_NAME" --profile "$PROFILE" &> /dev/null; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" --profile "$PROFILE"
    echo "✅ Created bucket: $BUCKET_NAME"
else
    echo "✅ Bucket already exists: $BUCKET_NAME"
fi

# Upload CSV files
echo "📤 Uploading CSV files..."

# Upload contacts file
aws s3 cp "public/master contacts from alf.csv" "s3://$BUCKET_NAME/master-contacts.csv" \
    --profile "$PROFILE" \
    --content-type "text/csv" \
    --cache-control "max-age=3600"

# Upload revenue file
aws s3 cp "public/Master Import file.csv" "s3://$BUCKET_NAME/master-revenue.csv" \
    --profile "$PROFILE" \
    --content-type "text/csv" \
    --cache-control "max-age=3600"

# Upload company file
aws s3 cp "public/master-company-file.csv" "s3://$BUCKET_NAME/master-company-file.csv" \
    --profile "$PROFILE" \
    --content-type "text/csv" \
    --cache-control "max-age=3600"

# Set bucket policy for public read access (adjust as needed for security)
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

echo "🔒 Setting bucket policy..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json --profile "$PROFILE"

# Cleanup
rm bucket-policy.json

echo "✅ Data files uploaded successfully!"
echo ""
echo "📊 Your data is now available at:"
echo "   https://$BUCKET_NAME.s3.$REGION.amazonaws.com/master-contacts.csv"
echo "   https://$BUCKET_NAME.s3.$REGION.amazonaws.com/master-revenue.csv"
echo "   https://$BUCKET_NAME.s3.$REGION.amazonaws.com/master-company-file.csv"
echo ""
echo "🔧 Update your environment variables:"
echo "   VITE_DATA_SOURCE=s3"
echo "   VITE_DEFAULT_MASTER_CSV=https://$BUCKET_NAME.s3.$REGION.amazonaws.com/master-contacts.csv"
echo ""
echo "🌐 Optional: Set up CloudFront CDN for better performance:"
echo "   1. Create CloudFront distribution"
echo "   2. Point origin to $BUCKET_NAME.s3.$REGION.amazonaws.com"
echo "   3. Update URLs to use CloudFront domain"
echo ""
echo "🔒 Security considerations:"
echo "   - Consider making bucket private and using signed URLs"
echo "   - Implement proper IAM policies"
echo "   - Use CloudFront with authentication if needed"
