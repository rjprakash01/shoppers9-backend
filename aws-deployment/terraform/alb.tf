# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-alb"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.enable_deletion_protection

  tags = var.tags
}

# Target Groups
resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "admin" {
  name        = "${var.project_name}-admin-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "admin_backend" {
  name        = "${var.project_name}-admin-backend-tg"
  port        = 5001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.project_name}-frontend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

# Listeners
resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = var.tags
}

# HTTP Listener Rules for Backend API (when no SSL certificate)
resource "aws_lb_listener_rule" "backend_http" {
  count = var.certificate_arn == "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = var.tags
}

# HTTP Listener Rules for Admin Backend API (when no SSL certificate)
resource "aws_lb_listener_rule" "admin_backend_api_http" {
  count = var.certificate_arn == "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend.arn
  priority     = 150

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.admin_backend.arn
  }

  condition {
    path_pattern {
      values = ["/admin-api/*"]
    }
  }

  tags = var.tags
}

# HTTP Listener Rules for Admin Frontend (when no SSL certificate)
resource "aws_lb_listener_rule" "admin_http" {
  count = var.certificate_arn == "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.admin.arn
  }

  condition {
    path_pattern {
      values = ["/admin/*"]
    }
  }

  tags = var.tags
}

resource "aws_lb_listener" "frontend_https" {
  count = var.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = var.tags
}

# Listener Rules for API
resource "aws_lb_listener_rule" "backend" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend_https[0].arn
  priority     = 100

  action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.backend.arn
      }
    }
  }

  condition {
    host_header {
      values = [var.api_domain_name]
    }
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = var.tags
}

# Listener Rule for API path on main domain
resource "aws_lb_listener_rule" "backend_path" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend_https[0].arn
  priority     = 150

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    host_header {
      values = [var.domain_name, "www.${var.domain_name}"]
    }
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = var.tags
}

# Listener Rule for Auth endpoints on API domain
resource "aws_lb_listener_rule" "backend_auth" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend_https[0].arn
  priority     = 160

  action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.backend.arn
      }
    }
  }

  condition {
    host_header {
      values = [var.api_domain_name]
    }
  }

  condition {
    path_pattern {
      values = ["/auth/*"]
    }
  }

  tags = var.tags
}

# Listener Rules for Admin Backend API
resource "aws_lb_listener_rule" "admin_backend_api" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend_https[0].arn
  priority     = 180

  action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.admin_backend.arn
      }
    }
  }

  condition {
    host_header {
      values = [var.admin_domain_name]
    }
  }

  condition {
    path_pattern {
      values = ["/admin-api/*"]
    }
  }

  tags = var.tags
}

# Listener Rules for Admin Frontend
resource "aws_lb_listener_rule" "admin" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend_https[0].arn
  priority     = 200

  action {
    type = "forward"
    forward {
      target_group {
        arn = aws_lb_target_group.admin.arn
      }
    }
  }

  condition {
    host_header {
      values = [var.admin_domain_name]
    }
  }

  tags = var.tags
}

# Listener Rule for Admin path on main domain
resource "aws_lb_listener_rule" "admin_path" {
  count = var.certificate_arn != "" ? 1 : 0

  listener_arn = aws_lb_listener.frontend_https[0].arn
  priority     = 250

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.admin.arn
  }

  condition {
    host_header {
      values = [var.domain_name, "www.${var.domain_name}"]
    }
  }

  condition {
    path_pattern {
      values = ["/admin/*"]
    }
  }

  tags = var.tags
}

# HTTP Listeners (for development/testing without SSL)
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "3001"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  tags = var.tags
}

# Removed duplicate admin listener - using port 8080 for admin instead

# HTTP Listener for Admin Backend
resource "aws_lb_listener" "admin_backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "5001"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.admin_backend.arn
  }

  tags = var.tags
}

# HTTP Listener for Frontend (development/testing without SSL)
resource "aws_lb_listener" "frontend_http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "8080"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = var.tags
}