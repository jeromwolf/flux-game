#!/bin/bash

echo "🛑 Flux Game 서버를 종료합니다..."

if [ ! -f .pid ]; then
    echo "⚠️  서버가 실행 중이지 않습니다."
    exit 1
fi

PID=$(cat .pid)

if ps -p $PID > /dev/null 2>&1; then
    kill $PID
    echo "✅ 서버를 종료했습니다 (PID: $PID)"
    rm -f .pid
else
    echo "⚠️  프로세스를 찾을 수 없습니다 (PID: $PID)"
    rm -f .pid
fi