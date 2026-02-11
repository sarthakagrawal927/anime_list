FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
COPY server.ts ./
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
