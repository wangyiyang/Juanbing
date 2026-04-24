#!/bin/bash
set -e

echo "=== Juanbing Docker 部署脚本 ==="

# 1. 检测并放行 28080 端口
echo "[1/4] 检查并放行 28080 端口..."
if command -v ufw &>/dev/null; then
    sudo ufw allow 28080/tcp || true
    echo "  ufw 已放行 28080"
elif command -v firewall-cmd &>/dev/null; then
    sudo firewall-cmd --permanent --add-port=28080/tcp || true
    sudo firewall-cmd --reload || true
    echo "  firewalld 已放行 28080"
fi

# 2. 停止占用 18080 的容器（避免端口冲突干扰）
echo "[2/4] 检查 18080 端口占用..."
OLD_CONTAINER=$(docker ps --filter "publish=18080" --format "{{.Names}}" | head -n1)
if [ -n "$OLD_CONTAINER" ]; then
    echo "  发现 $OLD_CONTAINER 占用 18080，停止该容器..."
    docker stop "$OLD_CONTAINER" || true
else
    echo "  18080 无冲突容器"
fi

# 3. 拉取最新代码并重新构建
echo "[3/4] 重新构建并启动 juanbing..."
docker compose down || true
docker compose up --build -d

# 4. 验证状态
echo "[4/4] 验证服务状态..."
sleep 3
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:28080/ || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo ""
    echo "✅ 部署成功！访问地址："
    echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP'):28080/"
else
    echo ""
    echo "⚠️ 服务状态异常，HTTP 状态码: $HEALTH"
    echo "   查看日志：docker compose logs -f"
    exit 1
fi
