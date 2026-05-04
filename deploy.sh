#!/bin/bash

# Deployment Script for Task Monorepo
# Usage: ./deploy.sh [backend|frontend|admin|company|all]

set -e

echo "🚀 Task Monorepo Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}📦 Deploying Backend...${NC}"
    cd backend
    vercel --prod
    cd ..
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}📦 Deploying User Frontend...${NC}"
    cd frontend
    vercel --prod
    cd ..
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
}

# Function to deploy admin
deploy_admin() {
    echo -e "${YELLOW}📦 Deploying Admin Dashboard...${NC}"
    cd admin
    vercel --prod
    cd ..
    echo -e "${GREEN}✅ Admin deployed successfully!${NC}"
}

# Function to deploy company dashboard
deploy_company() {
    echo -e "${YELLOW}📦 Deploying Company Dashboard...${NC}"
    cd tourcompanydashboard
    vercel --prod
    cd ..
    echo -e "${GREEN}✅ Company Dashboard deployed successfully!${NC}"
}

# Main deployment logic
case "$1" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    admin)
        deploy_admin
        ;;
    company)
        deploy_company
        ;;
    all)
        echo -e "${YELLOW}🚀 Deploying all applications...${NC}"
        deploy_backend
        sleep 2
        deploy_frontend
        sleep 2
        deploy_admin
        sleep 2
        deploy_company
        echo -e "${GREEN}✅ All applications deployed successfully!${NC}"
        ;;
    *)
        echo -e "${RED}Usage: $0 {backend|frontend|admin|company|all}${NC}"
        echo ""
        echo "Examples:"
        echo "  $0 backend    # Deploy only backend"
        echo "  $0 frontend   # Deploy only user frontend"
        echo "  $0 admin      # Deploy only admin dashboard"
        echo "  $0 company    # Deploy only company dashboard"
        echo "  $0 all        # Deploy all applications"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check deployment logs in Vercel dashboard"
echo "2. Test your applications"
echo "3. Update environment variables if needed"
