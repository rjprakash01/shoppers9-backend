# DocumentDB Subnet Group
resource "aws_docdb_subnet_group" "main" {
  name       = "${var.project_name}-docdb-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-docdb-subnet-group"
  })
}

# DocumentDB Security Group
resource "aws_security_group" "docdb" {
  name        = "${var.project_name}-docdb"
  description = "Security group for DocumentDB cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-docdb"
  })
}

# DocumentDB Parameter Group
resource "aws_docdb_cluster_parameter_group" "main" {
  family = "docdb4.0"
  name   = "${var.project_name}-docdb-params"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "ttl_monitor"
    value = "enabled"
  }

  tags = var.tags
}

# DocumentDB Cluster
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "${var.project_name}-docdb-cluster"
  engine                  = "docdb"
  engine_version          = "4.0.0"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:09:00-sun:11:00"
  skip_final_snapshot     = true
  deletion_protection     = var.enable_deletion_protection
  
  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.docdb.id]
  
  storage_encrypted = false
  # kms_key_id       = aws_kms_key.docdb.arn
  
  # enabled_cloudwatch_logs_exports = ["audit", "profiler"]
  
  tags = var.tags
}

# DocumentDB Cluster Instances
resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "${var.project_name}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.db_instance_class
  
  tags = var.tags
}

# KMS Key for DocumentDB encryption
resource "aws_kms_key" "docdb" {
  description             = "KMS key for DocumentDB encryption"
  deletion_window_in_days = 7
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-docdb-kms"
  })
}

resource "aws_kms_alias" "docdb" {
  name          = "alias/${var.project_name}-docdb"
  target_key_id = aws_kms_key.docdb.key_id
}

# CloudWatch Log Groups for DocumentDB
# resource "aws_cloudwatch_log_group" "docdb_audit" {
#   name              = "/aws/docdb/${var.project_name}/audit"
#   retention_in_days = 30
#   
#   tags = var.tags
# }

# resource "aws_cloudwatch_log_group" "docdb_profiler" {
#   name              = "/aws/docdb/${var.project_name}/profiler"
#   retention_in_days = 7
#   
#   tags = var.tags
# }