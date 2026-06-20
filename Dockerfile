FROM nginx:alpine

LABEL maintainer="wild-breath-mini"
LABEL description="塞尔达旷野之息·迷你版 - 手机横屏3D网页游戏"

# 清空默认页面，拷贝整个游戏目录
COPY . /usr/share/nginx/html

# 用自定义 nginx 配置（gzip + 缓存 + 移动端优化）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 健康检查（可选）
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
