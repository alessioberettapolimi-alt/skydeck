@echo off
title Starting SkyDeck Radar
cd /d C:\repos\skydeck
echo Starting SkyDeck background services...

:: 1. Launch the dev server minimized/backgrounded so it doesn't block this script
start /b powershell -Command "$env:DATA_SOURCE='api'; npx pnpm dev --host"

echo Check sequence initiated. Waiting for port 5173 to wake up...

:PING_LOOP
:: Use Windows' native network tool to check if port 5173 is accepting connections
powershell -Command "try { $client = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 5173); $client.Close(); exit 0 } catch { exit 1 }"

:: If the exit code is 0, the port is open! Jump out of the loop.
if %errorlevel% equ 0 (
    goto LAUNCH_BROWSER
)

:: Otherwise, wait 1 second and check again
timeout /t 1 /nobreak > nul
goto PING_LOOP

:LAUNCH_BROWSER
echo.
echo [SUCCESS] SkyDeck Core is live! Opening display interface...
start http://localhost:5173/