FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json server.js index.html ./
RUN apt-get update && apt-get install -y --no-install-recommends powershell ca-certificates && rm -rf /var/lib/apt/lists/*
EXPOSE 8787
CMD ["node", "server.js"]
