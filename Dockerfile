FROM node:22-alpine

LABEL maintainer="wild-breath-mini"
LABEL description="塞尔达旷野之息·迷你版 - 手机横屏3D网页游戏 + JSON 云存档"

WORKDIR /app

# 拷贝游戏和轻量 Node 云存档服务器
COPY . .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:8080/api/cloud/status || exit 1

CMD ["node", "cloud-server.mjs"]
