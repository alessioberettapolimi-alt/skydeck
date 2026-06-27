@echo off
title Starting SkyDeck Radar
cd /d C:\repos\skydeck
echo Starting the server...

:: Open browser page
start http://localhost:5173/

:: Launcher!
powershell -NoExit -Command "$env:DATA_SOURCE='api'; npx pnpm dev"