#!/usr/bin/env pwsh

Write-Host "DIAGNOSTICANDO CONFIGURACION DE PROXY" -ForegroundColor Cyan

# 1. Verifica proxy.conf.json
Write-Host "`n1. Revisando proxy.conf.json..." -ForegroundColor Yellow
if (Test-Path "front/proxy.conf.json") {
    $proxyConfig = Get-Content "front/proxy.conf.json" | ConvertFrom-Json
    Write-Host "OK - Archivo existe" -ForegroundColor Green
    Write-Host "Target: $($proxyConfig.'/api'.target)"
} else {
    Write-Host "ERROR - NO EXISTE front/proxy.conf.json" -ForegroundColor Red
}

# 2. Verifica script
Write-Host "`n2. Revisando package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "front/package.json" | ConvertFrom-Json
$startScript = $packageJson.scripts.start
Write-Host "Script: $startScript"
if ($startScript -like "*proxy*") {
    Write-Host "OK - Proxy esta en el script" -ForegroundColor Green
} else {
    Write-Host "ERROR - Script NO incluye proxy" -ForegroundColor Red
}

# 3. Verifica conexion
Write-Host "`n3. Probando conexion a backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/usuarios" -Method GET -Headers @{"Authorization" = "Bearer test"} -ErrorAction Stop
    Write-Host "OK - Backend respondio" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.Value_
    Write-Host "Backend retorno: $status" -ForegroundColor Yellow
}

Write-Host "`nDONE" -ForegroundColor Green
