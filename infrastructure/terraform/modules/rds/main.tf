resource "aws_db_subnet_group" "main" {
  name       = "safestream-${var.environment}"
  subnet_ids = var.private_subnet_ids
  tags = { Name = "safestream-${var.environment}" }
}

resource "aws_security_group" "rds" {
  name   = "safestream-rds-${var.environment}"
  vpc_id = var.vpc_id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
}

resource "aws_db_instance" "main" {
  identifier             = "safestream-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  max_allocated_storage  = var.max_allocated_storage
  storage_encrypted      = true
  db_name                = "safestream"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = var.environment == "production"
  deletion_protection    = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 7 : 1
  skip_final_snapshot    = var.environment != "production"
  performance_insights_enabled = true
  tags = { Environment = var.environment }
}

output "db_endpoint"  { value = aws_db_instance.main.endpoint }
output "db_name"      { value = aws_db_instance.main.db_name }
