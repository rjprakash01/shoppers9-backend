#!/bin/bash

# Script to build Docker images in AWS EC2

echo "Creating EC2 instance for Docker build..."

# Launch EC2 instance with Docker
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.medium \
    --key-name shoppers9-key \
    --security-group-ids sg-default \
    --user-data '#!/bin/bash
yum update -y
yum install -y docker git
service docker start
usermod -a -G docker ec2-user
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=shoppers9-build}]' \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance ID: $INSTANCE_ID"
echo "Waiting for instance to be running..."

aws ec2 wait instance-running --instance-ids $INSTANCE_ID

echo "Getting instance public IP..."
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "Instance is ready at: $PUBLIC_IP"
echo "You can now SSH to the instance and build Docker images"
echo "ssh -i shoppers9-key.pem ec2-user@$PUBLIC_IP"