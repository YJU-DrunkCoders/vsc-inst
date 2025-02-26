
FROM node:14

WORKDIR /app

COPY src/package*.json ./

RUN npm install --only=production

COPY src/instagram-proxy-server.js .

EXPOSE 49155

CMD [ "node", "instagram-proxy-server.js" ]
