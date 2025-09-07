#!/bin/bash

# Shoppers9 Local Development Script
# This script sets up and runs the application locally using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f "aws-deployment/.env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp aws-deployment/.env.example aws-deployment/.env
        print_warning "Please edit aws-deployment/.env with your actual values before running again."
        exit 1
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    
    cd aws-deployment
    
    # Build all images
    docker-compose build
    
    print_success "Docker images built successfully."
    
    cd ..
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    cd aws-deployment
    
    # Start all services
    docker-compose up -d
    
    print_success "Services started successfully."
    
    cd ..
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    
    cd aws-deployment
    
    # Stop all services
    docker-compose down
    
    print_success "Services stopped successfully."
    
    cd ..
}

# Function to show logs
show_logs() {
    local service=${1:-""}
    
    cd aws-deployment
    
    if [ -n "$service" ]; then
        print_status "Showing logs for $service..."
        docker-compose logs -f $service
    else
        print_status "Showing logs for all services..."
        docker-compose logs -f
    fi
    
    cd ..
}

# Function to show service status
show_status() {
    print_status "Checking service status..."
    
    cd aws-deployment
    
    docker-compose ps
    
    cd ..
}

# Function to restart services
restart_services() {
    local service=${1:-""}
    
    cd aws-deployment
    
    if [ -n "$service" ]; then
        print_status "Restarting $service..."
        docker-compose restart $service
    else
        print_status "Restarting all services..."
        docker-compose restart
    fi
    
    print_success "Services restarted successfully."
    
    cd ..
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    cd aws-deployment
    
    # Stop and remove containers, networks, and volumes
    docker-compose down -v
    
    # Remove images
    docker-compose down --rmi all
    
    print_success "Cleanup completed."
    
    cd ..
}

# Function to show application URLs
show_urls() {
    print_success "Application URLs:"
    echo "Frontend (Customer): http://localhost:3002"
    echo "Admin Panel: http://localhost:3001"
    echo "Backend API: http://localhost:3000"
    echo "MongoDB: mongodb://localhost:27017"
    echo "Redis: redis://localhost:6379"
    echo
    print_status "Health check endpoints:"
    echo "Backend: http://localhost:3000/health"
    echo "Admin: http://localhost:3001/health"
    echo "Frontend: http://localhost:3002/health"
}

# Function to run database migrations/setup
setup_database() {
    print_status "Setting up database..."
    
    cd aws-deployment
    
    # Wait for MongoDB to be ready
    print_status "Waiting for MongoDB to be ready..."
    sleep 10
    
    # Run database initialization
    docker-compose exec mongodb mongo --eval "print('MongoDB is ready')"
    
    print_success "Database setup completed."
    
    cd ..
}

# Function to show help
show_help() {
    echo "Shoppers9 Local Development Script"
    echo
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  start           Start all services"
    echo "  stop            Stop all services"
    echo "  restart [svc]   Restart all services or specific service"
    echo "  build           Build Docker images"
    echo "  logs [svc]      Show logs for all services or specific service"
    echo "  status          Show service status"
    echo "  urls            Show application URLs"
    echo "  setup-db        Setup database"
    echo "  cleanup         Stop services and remove containers/images"
    echo "  help            Show this help message"
    echo
    echo "Services:"
    echo "  backend         Backend API service"
    echo "  admin           Admin panel service"
    echo "  frontend        Customer frontend service"
    echo "  mongodb         MongoDB database service"
    echo "  redis           Redis cache service"
    echo
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs backend             # Show backend logs"
    echo "  $0 restart mongodb          # Restart MongoDB service"
}

# Main function
main() {
    local command=${1:-"help"}
    local service=${2:-""}
    
    case $command in
        "start")
            check_docker
            check_env_file
            build_images
            start_services
            sleep 5
            show_urls
            ;;
        "stop")
            check_docker
            stop_services
            ;;
        "restart")
            check_docker
            restart_services $service
            ;;
        "build")
            check_docker
            check_env_file
            build_images
            ;;
        "logs")
            check_docker
            show_logs $service
            ;;
        "status")
            check_docker
            show_status
            ;;
        "urls")
            show_urls
            ;;
        "setup-db")
            check_docker
            setup_database
            ;;
        "cleanup")
            check_docker
            cleanup
            ;;
        "help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"