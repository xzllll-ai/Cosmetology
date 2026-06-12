#!/bin/bash
# 一键启动 Beauty Pipeline 后端 + Cloudflare Tunnel

set -e

TUNNEL_BIN="$HOME/.local/bin/cloudflared"
API_DIR="/apps/users/xzl/aesthetic"

echo "🚀 启动 Beauty Pipeline 服务..."
echo ""

# 启动 Cloudflare Tunnel（后台）
echo "  [1/2] 启动 Cloudflare Tunnel → api.243707.xyz"
nohup $TUNNEL_BIN tunnel run beauty > /tmp/cloudflared.log 2>&1 &
TUNNEL_PID=$!
echo "        PID: $TUNNEL_PID"

# 等待隧道就绪
sleep 2
if kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "        ✅ 隧道已启动"
else
    echo "        ❌ 隧道启动失败，查看日志: /tmp/cloudflared.log"
    exit 1
fi

# 启动 API Server（前台）
echo "  [2/2] 启动 API Server → http://0.0.0.0:8000"
echo ""
echo "========================================="
echo "  🌐 前端: https://cosmetology-nine.vercel.app"
echo "  🔗 API:  https://api.243707.xyz"
echo "  📋 健康检查: https://api.243707.xyz/health"
echo "  按 Ctrl+C 停止所有服务"
echo "========================================="
echo ""

cd "$API_DIR"

# 捕获 Ctrl+C，同时停掉隧道
trap "echo ''; echo '🛑 正在停止...'; kill $TUNNEL_PID 2>/dev/null; echo '✅ 已停止'; exit 0" INT TERM

python -m beauty_pipeline.api_server
