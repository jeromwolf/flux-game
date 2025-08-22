#!/bin/bash

echo "🎮 Flux Game Next.js 서버를 시작합니다..."

# 이미 실행 중인지 확인
if [ -f .pid ]; then
    PID=$(cat .pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️  서버가 이미 실행 중입니다 (PID: $PID)"
        echo "먼저 ./stop.sh를 실행하세요."
        exit 1
    fi
fi

# 프로덕션 빌드가 있는지 확인
if [ ! -d ".next" ]; then
    echo "📦 프로덕션 빌드가 없습니다. 빌드를 시작합니다..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 빌드 실패!"
        exit 1
    fi
fi

# 서버 시작
nohup npm start > flux-game.log 2>&1 &
PID=$!

# PID 저장
echo $PID > .pid

echo "✅ Next.js 서버가 시작되었습니다 (PID: $PID)"
echo "📍 포트: 3100"
echo "🌐 주소: http://localhost:3100"
echo "📋 로그: tail -f flux-game.log"
echo ""
echo "💡 개발 모드로 실행하려면: npm run dev"