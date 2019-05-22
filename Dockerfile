FROM keymetrics/pm2:10-alpine

RUN apk add --no-cache git make gcc g++ python
WORKDIR /usr/src/app
COPY package*.json ./
COPY ecosystem.config.js ./
RUN npm install
RUN npm run build-all
COPY . .
EXPOSE 9000
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
