@echo off
cd /d "%~dp0kit"
echo == Instalando lo necesario (solo tarda la primera vez) ==
call npm install --no-audit --no-fund
echo == Haciendo el clip pricetag_demo con la tarjeta grafica ==
node scripts\make_video.cjs pricetag_demo --gpu --workers=4
echo.
echo El video queda en kit\out\pricetag_demo\pricetag_demo.mp4
pause
