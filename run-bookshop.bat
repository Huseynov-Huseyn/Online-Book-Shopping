@echo off
title Online Book Shopping System
echo =========================================
echo      ONLINE BOOK SHOPPING - BAŞLADILIR
echo =========================================
echo.
echo Backend (Spring Boot) serveri ise salinir...
cd Backend
start "BookShop Backend" /MIN cmd /c "gradlew.bat bootRun"

echo.
echo Backend serverinin tam isə düşməsi gözlənilir (Bu ilk dəfə 30-40 saniyə çəkə bilər, zəhmət olmasa gözləyin)...

:waitloop
timeout /t 3 /nobreak >nul
curl -s http://localhost:8080/api/books >nul
if errorlevel 1 (
    goto waitloop
)

echo.
echo Backend tam hazirdir! Frontend (Sistem interfeysi) acilir...
cd ..\Frontend\Main
start "BookShop Frontend Server" /MIN cmd /c "npx.cmd http-server -p 5500"
timeout /t 3 /nobreak >nul
start http://localhost:5500

echo.
echo Sistem ugurla isə salindi! 
echo Eger sistemi dayandirmaq isterseniz, bu pencereyi ve arxa planda acilan cmd penceresini baglayin.
pause
