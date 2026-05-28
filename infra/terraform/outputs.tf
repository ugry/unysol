output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "nameservers" {
  value = aws_route53_zone.main.name_servers
}

output "app_url" {
  value = "https://${var.domain_name}"
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
