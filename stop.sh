#!/bin/bash

echo "🛑 Flux Game Next.js 서버를 종료합니다..."

if [ ! -f .pid ]; then
    echo "⚠️  서버가 실행 중이지 않습니다."
    
    # 혹시 남아있는 Next.js 프로세스 확인
    NEXT_PID=$(ps aux | grep '[n]ext-server' | awk '{print $2}')
    if [ ! -z "$NEXT_PID" ]; then
        echo "🔍 Next.js 프로세스를 발견했습니다 (PID: $NEXT_PID)"
        kill $NEXT_PID
        echo "✅ Next.js 프로세스를 종료했습니다"
    fi
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

# 개발 서버도 종료 (혹시 실행 중일 경우)
DEV_PID=$(ps aux | grep '[n]ext dev -p 3100' | awk '{print $2}')
if [ ! -z "$DEV_PID" ]; then
    echo "🔍 개발 서버도 실행 중입니다 (PID: $DEV_PID)"
    kill $DEV_PID
    echo "✅ 개발 서버를 종료했습니다"
fi