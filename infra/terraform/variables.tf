variable "project" {
  default = "unysol"
}

variable "environment" {
  default = "production"
}

variable "aws_region" {
  default = "eu-central-1"
}

variable "domain_name" {
  default = "unysolar.com"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "db_username" {
  sensitive = true
}

variable "db_password" {
  sensitive = true
}

variable "db_name" {
  default = "unysol"
}

variable "jwt_secret" {
  sensitive = true
}

variable "backend_cpu" {
  default = 256
}

variable "backend_memory" {
  default = 512
}

variable "frontend_cpu" {
  default = 256
}

variable "frontend_memory" {
  default = 512
}

variable "backend_desired_count" {
  default = 1
}

variable "stripe_secret_key" {
  sensitive = true
}

variable "stripe_publishable_key" {
  sensitive = true
}

variable "resend_api_key" {
  sensitive = true
  default   = ""
}

variable "frontend_desired_count" {
  default = 1
}
