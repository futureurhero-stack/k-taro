# 한복 타로 점 웹사이트 실행 스크립트 (PowerShell)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "한복 타로 점 웹사이트 실행" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Python 확인
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python이 감지되었습니다: $pythonVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "서버를 시작합니다..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "브라우저에서 http://localhost:8000 으로 접속하세요." -ForegroundColor Green
    Write-Host "서버를 중지하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow
    Write-Host ""
    
    # 현재 디렉토리로 이동
    Set-Location $PSScriptRoot
    
    # 서버 시작
    python -m http.server 8000
}
catch {
    Write-Host "Python이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "다른 실행 방법:" -ForegroundColor Yellow
    Write-Host "1. Python 설치: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "2. 또는 Node.js 설치 후: npx http-server" -ForegroundColor White
    Write-Host "3. 또는 index.html 파일을 브라우저에서 직접 열기" -ForegroundColor White
    Write-Host ""
    Read-Host "아무 키나 누르면 종료됩니다"
}


