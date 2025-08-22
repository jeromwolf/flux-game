#!/bin/bash

echo "🚀 Flux Game Next.js 개발 서버를 시작합니다..."

# 이미 실행 중인지 확인
DEV_PID=$(ps aux | grep '[n]ext dev -p 3100' | awk '{print $2}')
if [ ! -z "$DEV_PID" ]; then
    echo "⚠️  개발 서버가 이미 실행 중입니다 (PID: $DEV_PID)"
    echo "먼저 Ctrl+C로 종료하거나 ./stop.sh를 실행하세요."
    exit 1
fi

# 개발 서버 시작
echo "📍 포트: 3100"
echo "🌐 주소: http://localhost:3100"
echo "🔄 파일 변경 시 자동 새로고침됩니다"
echo "⏹️  종료하려면 Ctrl+C를 누르세요"
echo ""

npm run dev