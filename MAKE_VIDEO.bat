@echo off
chcp 65001 >nul
color 0A

echo =======================================================
echo          🎇 DARK NEEDLE FACTORY - LOCAL PIPELINE       
echo =======================================================
echo.
echo Kich ban chuan bi duoc xu ly thanh Video (MP4)...
echo.

echo [1/6] 🎬 Director Agent dang khoi doan (Gemini AI)...
python tools\gemini_director.py
if %errorlevel% neq 0 (
    echo ❌ LOI tai Director Agent!
    pause
    exit /b %errorlevel%
)
echo.

echo [2/6] 🎙️ Audio Agent dang thu am (ElevenLabs)...
python tools\elevenlabs_audio_tool.py
if %errorlevel% neq 0 (
    echo ❌ LOI tai Audio Agent!
    pause
    exit /b %errorlevel%
)
echo.

echo [3/6] ⏱️ Sync Agent dang dong bo khung hinh...
node tools\plan_processor.js
if %errorlevel% neq 0 (
    echo ❌ LOI tai Sync Agent!
    pause
    exit /b %errorlevel%
)
echo.

echo [4/6] 💻 Code Agent dang sinh ma React...
node tools\code_generator.js
if %errorlevel% neq 0 (
    echo ❌ LOI tai Code Agent!
    pause
    exit /b %errorlevel%
)
echo.

echo [5/6] 🏗️ Structure Agent dang cap nhat Root.tsx...
node tools\structure_agent.js
if %errorlevel% neq 0 (
    echo ❌ LOI tai Structure Agent!
    pause
    exit /b %errorlevel%
)
echo.

echo [6/6] 🎥 Render Engine dang xuat thanh pham (Remotion)...
echo Qua trinh nay co the mat 1-3 phut tuy thuoc do dai video.
call npx remotion render AutoVideo "final_product.mp4" --overwrite
if %errorlevel% neq 0 (
    echo ❌ LOI tai Render Engine!
    pause
    exit /b %errorlevel%
)
echo.

echo =======================================================
echo 🎉 HOAN THANH! Video da duoc luu thanh cong tai:
echo    %CD%\final_product.mp4
echo =======================================================
pause
