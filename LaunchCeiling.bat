@echo off
title Avvio Skylight Radar
cd /d C:\repos\skylight
echo Avvio del server radar in corso...

:: Apre automaticamente la pagina nel browser predefinito di Windows
start http://localhost:5173/

:: Avvia il server radar e tiene aperta la finestra di PowerShell
powershell -NoExit -Command "$env:DATA_SOURCE='api'; npx pnpm dev"