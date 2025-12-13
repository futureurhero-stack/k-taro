@echo off
echo ====================================
echo 한복 타로 점 웹사이트 실행
echo ====================================
echo.

REM Python이 설치되어 있는지 확인
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Python이 감지되었습니다.
    echo 서버를 시작합니다...
    echo.
    echo 브라우저에서 http://localhost:8000 으로 접속하세요.
    echo 서버를 중지하려면 Ctrl+C를 누르세요.
    echo.
    python -m http.server 8000
) else (
    echo Python이 설치되어 있지 않습니다.
    echo.
    echo 다른 방법:
    echo 1. Python 설치: https://www.python.org/downloads/
    echo 2. 또는 Node.js 설치 후: npx http-server
    echo 3. 또는 index.html 파일을 브라우저에서 직접 열기
    echo.
    pause
)


