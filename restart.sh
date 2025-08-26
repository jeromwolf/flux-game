#!/bin/bash

echo "🔄 Flux Game Next.js 서버를 재시작합니다..."

# 현재 실행 모드 확인
if [ -z "$1" ]; then
    MODE="dev"
else
    MODE=$1
fi

# 서버 종료
./stop.sh

# 잠시 대기 (프로세스 완전 종료 대기)
sleep 1

# 서버 시작
if [ "$MODE" = "prod" ]; then
    echo "📦 프로덕션 모드로 재시작합니다..."
    ./start.sh
elif [ "$MODE" = "dev" ]; then
    echo "🚀 개발 모드로 재시작합니다..."
    ./dev.sh
else
    echo "❌ 잘못된 모드입니다. 'dev' 또는 'prod'를 사용하세요."
    echo "사용법:"
    echo "  ./restart.sh        # 개발 모드 (기본)"
    echo "  ./restart.sh dev    # 개발 모드"
    echo "  ./restart.sh prod   # 프로덕션 모드"
    exit 1
fi