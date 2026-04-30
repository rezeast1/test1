@echo off
setlocal

REM ====== ЗАПУСК OMNIROUTE ======
echo Starting OmniRoute...
start "OmniRoute" cmd /k omniroute

:wait_loop
curl -s http://localhost:20128/v1 >nul 2>&1
if errorlevel 1 (
    echo Waiting for OmniRoute...
    timeout /t 1 >nul
    goto wait_loop
)

REM Вставь сюда свой ключ OmniRoute
set "ANTHROPIC_AUTH_TOKEN=sk-7d7511ed8fb1d9e9-006ab8-b0caf914"

REM Вставь сюда Anthropic-compatible endpoint OmniRoute
set "ANTHROPIC_BASE_URL=http://localhost:20128/v1"

REM Опционально: если gateway не любит experimental betas
set "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1"

REM Опционально: модель, если твой gateway требует явное имя
set "ANTHROPIC_MODEL=kr/claude-sonnet-4.5"

echo Starting Claude Code via OmniRoute...
claude

endlocal