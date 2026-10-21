FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --registry=https://registry.npmmirror.com
COPY src ./src
EXPOSE 3002
CMD ["node", "src/app.js"]
