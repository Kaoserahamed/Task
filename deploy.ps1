# PowerShell Deployment Script for Task Monorepo
# Usage: .\deploy.ps1 [backend|frontend|admin|company|all]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('backend','frontend','admin','company','all')]
    [string]$Target
)

Write-Host "🚀 Task Monorepo Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

function Deploy-Backend {
    Write-Host "📦 Deploying Backend..." -ForegroundColor Yellow
    Set-Location backend
    vercel --prod
    Set-Location ..
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
}

function Deploy-Frontend {
    Write-Host "📦 Deploying User Frontend..." -ForegroundColor Yellow
    Set-Location frontend
    vercel --prod
    Set-Location ..
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
}

function Deploy-Admin {
    Write-Host "📦 Deploying Admin Dashboard..." -ForegroundColor Yellow
    Set-Location admin
    vercel --prod
    Set-Location ..
    Write-Host "✅ Admin deployed successfully!" -ForegroundColor Green
}

function Deploy-Company {
    Write-Host "📦 Deploying Company Dashboard..." -ForegroundColor Yellow
    Set-Location tourcompanydashboard
    vercel --prod
    Set-Location ..
    Write-Host "✅ Company Dashboard deployed successfully!" -ForegroundColor Green
}

# Main deployment logic
switch ($Target) {
    'backend' {
        Deploy-Backend
    }
    'frontend' {
        Deploy-Frontend
    }
    'admin' {
        Deploy-Admin
    }
    'company' {
        Deploy-Company
    }
    'all' {
        Write-Host "🚀 Deploying all applications..." -ForegroundColor Yellow
        Write-Host ""
        
        Deploy-Backend
        Start-Sleep -Seconds 2
        
        Deploy-Frontend
        Start-Sleep -Seconds 2
        
        Deploy-Admin
        Start-Sleep -Seconds 2
        
        Deploy-Company
        
        Write-Host ""
        Write-Host "✅ All applications deployed successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check deployment logs in Vercel dashboard"
Write-Host "2. Test your applications"
Write-Host "3. Update environment variables if needed"
