terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "safestream-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "safestream-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

module "rds" {
  source              = "../../modules/rds"
  environment         = "production"
  vpc_id              = var.vpc_id
  vpc_cidr            = var.vpc_cidr
  private_subnet_ids  = var.private_subnet_ids
  instance_class      = "db.r6g.2xlarge"
  allocated_storage   = 500
  max_allocated_storage = 5000
  db_username         = var.db_username
  db_password         = var.db_password
}
