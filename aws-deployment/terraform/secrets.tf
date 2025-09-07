# AWS Secrets Manager for sensitive configuration

# MongoDB URI Secret
resource "aws_secretsmanager_secret" "mongodb_uri" {
  name        = "${var.project_name}/mongodb-uri"
  description = "MongoDB connection URI for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = jsonencode({
    uri = "mongodb+srv://${var.db_username}:${var.db_password}@${aws_docdb_cluster.main.endpoint}:27017/${var.project_name}?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  })
}

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.project_name}/jwt-secret"
  description = "JWT secret key for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    secret = random_password.jwt_secret.result
  })
}

# SMS API Key Secret
resource "aws_secretsmanager_secret" "sms_api_key" {
  name        = "${var.project_name}/sms-api-key"
  description = "SMS API key for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "sms_api_key" {
  secret_id = aws_secretsmanager_secret.sms_api_key.id
  secret_string = jsonencode({
    api_key = "YOUR_SMS_API_KEY_HERE"
  })
}

# Razorpay Key ID Secret
resource "aws_secretsmanager_secret" "razorpay_key_id" {
  name        = "${var.project_name}/razorpay-key-id"
  description = "Razorpay Key ID for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "razorpay_key_id" {
  secret_id = aws_secretsmanager_secret.razorpay_key_id.id
  secret_string = jsonencode({
    key_id = "YOUR_RAZORPAY_KEY_ID_HERE"
  })
}

# Razorpay Key Secret
resource "aws_secretsmanager_secret" "razorpay_key_secret" {
  name        = "${var.project_name}/razorpay-key-secret"
  description = "Razorpay Key Secret for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "razorpay_key_secret" {
  secret_id = aws_secretsmanager_secret.razorpay_key_secret.id
  secret_string = jsonencode({
    key_secret = "YOUR_RAZORPAY_KEY_SECRET_HERE"
  })
}

# Database Password Secret
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.project_name}/db-password"
  description = "Database password for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = var.db_password
  })
}

# JWT Refresh Secret
resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name        = "${var.project_name}/jwt-refresh-secret"
  description = "JWT refresh secret key for Shoppers9 application"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_refresh_secret" {
  secret_id = aws_secretsmanager_secret.jwt_refresh_secret.id
  secret_string = random_password.jwt_refresh_secret.result
}

# Random password for JWT secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Random password for JWT refresh secret
resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
}

# IAM policy for ECS tasks to access secrets
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.project_name}-secrets-access"
  description = "Policy to allow ECS tasks to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.mongodb_uri.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.jwt_refresh_secret.arn,
          aws_secretsmanager_secret.sms_api_key.arn,
          aws_secretsmanager_secret.razorpay_key_id.arn,
          aws_secretsmanager_secret.razorpay_key_secret.arn,
          aws_secretsmanager_secret.db_password.arn
        ]
      }
    ]
  })

  tags = var.tags
}

# Attach secrets access policy to ECS task execution role
resource "aws_iam_role_policy_attachment" "ecs_secrets_access" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.secrets_access.arn
}