variable "environment"         { type = string }
variable "vpc_id"              { type = string }
variable "vpc_cidr"            { type = string }
variable "private_subnet_ids"  { type = list(string) }
variable "instance_class"      { type = string; default = "db.r6g.large" }
variable "allocated_storage"   { type = number; default = 100 }
variable "max_allocated_storage" { type = number; default = 1000 }
variable "db_username"         { type = string; sensitive = true }
variable "db_password"         { type = string; sensitive = true }
