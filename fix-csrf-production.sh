#!/bin/bash

echo "=== TrendHub 生产服务器 CSRF 错误修复脚本 ==="
echo ""

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在 TrendHub 项目根目录运行此脚本"
    exit 1
fi

echo "✅ 检测到 TrendHub 项目"
echo ""

# 1. 检查并修复环境变量
echo "1. 检查环境变量配置..."

if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.docker.fixed .env
    echo "✅ .env 文件已创建"
else
    echo "✅ .env 文件已存在"
fi

# 确保关键环境变量正确
echo "修复关键环境变量..."

# 备份原始 .env 文件
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 确保 AUTH_TRUST_HOST 存在
if ! grep -q "AUTH_TRUST_HOST=true" .env; then
    echo "AUTH_TRUST_HOST=true" >> .env
    echo "✅ 添加 AUTH_TRUST_HOST=true"
fi

# 确保 NEXTAUTH_URL 使用 localhost（容器内部）
sed -i 's|NEXTAUTH_URL=http://admin:3001|NEXTAUTH_URL=http://localhost:3001|g' .env
sed -i 's|NEXTAUTH_URL_INTERNAL=http://admin:3001|NEXTAUTH_URL_INTERNAL=http://localhost:3001|g' .env

echo "✅ 环境变量修复完成"
echo ""

# 2. 重新构建和部署
echo "2. 重新构建和部署容器..."

# 停止现有容器
echo "停止现有容器..."
docker compose down 2>/dev/null || docker-compose down

# 拉取最新镜像（包含我们的修复）
echo "拉取最新镜像..."
docker compose pull 2>/dev/null || docker-compose pull

# 清理旧的容器和镜像
echo "清理旧的容器和镜像..."
docker system prune -f

# 重新启动服务
echo "重新启动服务..."
docker compose up -d 2>/dev/null || docker-compose up -d

echo "✅ 容器重新部署完成"
echo ""

# 3. 等待服务启动
echo "3. 等待服务启动..."
sleep 15

# 4. 验证部署
echo "4. 验证部署状态..."

# 检查容器状态
echo "检查容器状态："
if docker ps | grep -q "trendhub-admin"; then
    echo "✅ admin 容器正在运行"
else
    echo "❌ admin 容器未运行"
fi

if docker ps | grep -q "postgres"; then
    echo "✅ postgres 容器正在运行"
else
    echo "❌ postgres 容器未运行"
fi

echo ""

# 5. 测试端点
echo "5. 测试关键端点..."

SERVER_IP="82.25.95.136"

test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -f --max-time 10 "$url" > /dev/null 2>&1; then
        echo "✅ $name: 可访问"
        return 0
    else
        echo "❌ $name: 不可访问"
        return 1
    fi
}

test_endpoint "http://${SERVER_IP}:3001/api/auth/csrf" "CSRF 端点"
test_endpoint "http://${SERVER_IP}:3001/api/auth/providers" "Providers 端点"
test_endpoint "http://${SERVER_IP}:3001/en/login" "登录页面"

echo ""

# 6. 检查最新日志
echo "6. 检查最新日志..."
echo "Admin 容器日志（最后 10 行）："

# 尝试不同的容器名称格式
if docker ps --format "{{.Names}}" | grep -q "trendhub-admin-1"; then
    docker logs trendhub-admin-1 --tail 10
elif docker ps --format "{{.Names}}" | grep -q "trendhub_admin_1"; then
    docker logs trendhub_admin_1 --tail 10
elif docker ps --format "{{.Names}}" | grep -q "admin"; then
    ADMIN_CONTAINER=$(docker ps --format "{{.Names}}" | grep admin | head -1)
    docker logs $ADMIN_CONTAINER --tail 10
else
    echo "❌ 找不到 admin 容器"
fi

echo ""

# 7. 最终验证
echo "7. 最终验证..."

# 检查是否还有 CSRF 错误
echo "检查是否还有 CSRF 错误..."
sleep 5

ADMIN_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i admin | head -1)
if [ ! -z "$ADMIN_CONTAINER" ]; then
    if docker logs $ADMIN_CONTAINER --tail 20 | grep -q "MissingCSRF"; then
        echo "❌ 仍然存在 CSRF 错误"
        echo ""
        echo "请尝试以下额外步骤："
        echo "1. 清除浏览器缓存和所有 Cookie"
        echo "2. 使用无痕模式访问"
        echo "3. 检查是否有代理或负载均衡器配置问题"
        echo "4. 确认服务器时间同步正确"
    else
        echo "✅ 未发现 CSRF 错误"
    fi
else
    echo "❌ 无法检查日志，admin 容器未找到"
fi

echo ""
echo "=== 修复完成 ==="
echo ""
echo "访问地址："
echo "- 登录页面: http://${SERVER_IP}:3001/en/login"
echo "- 管理后台: http://${SERVER_IP}:3001/en"
echo ""
echo "如果问题仍然存在："
echo "1. 等待 2-3 分钟让服务完全启动"
echo "2. 清除浏览器缓存和 Cookie"
echo "3. 检查服务器防火墙设置"
echo "4. 查看完整日志: docker logs <container-name> -f" 