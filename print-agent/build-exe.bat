@echo off
title Restiva Adisyon - Exe Derleyici
echo =======================================================
echo    RESTIVA PRINT BRIDGE EXE DERLEME ARACI
echo =======================================================
pip install pyinstaller
pyinstaller --noconfirm --onedir --windowed --name "RestivaPrintBridge" "restiva-print-bridge.py"
echo.
echo =======================================================
echo    DERLEME TAMAMLANDI! dist\RestivaPrintBridge\ klasorunde hazir.
echo =======================================================
pause
