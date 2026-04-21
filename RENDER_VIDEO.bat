@echo off
echo ======================================================
echo    He thong 5-Agent Video Production - Render Now
echo ======================================================
echo.
echo [*] Dang kiem tra thu vien...
call npm install @remotion/google-fonts

echo.
echo [*] Dang bat dau render video voi Gemini 1.5 Pro...
npx remotion render src/index.ts FullScript out.mp4 --overwrite

echo.
echo ======================================================
echo    THANH CONG! Video cua ban da san sang: out.mp4
echo ======================================================
pause
