@echo off
echo Starting Hardhat node...
start "Hardhat Node" cmd /k "npx hardhat node"
timeout /t 3
echo Starting web server...
start "Web Server" cmd /k "npx serve public -l 3000"
echo.
echo Development servers started!
echo - Hardhat Node: http://localhost:8545
echo - Web App: http://localhost:3000
echo.
pause
