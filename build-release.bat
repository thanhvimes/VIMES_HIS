@echo off
chcp 65001 > nul
title VIMES HIS - Đóng gói bản phát hành cập nhật tự động
echo ======================================================
echo    VIMES HIS - ĐÓNG GÓI BẢN CẬP NHẬT TỰ ĐỘNG (1-CLICK)
echo ======================================================
echo.
node scripts\build-release.cjs
echo.
pause
