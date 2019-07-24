FROM keymetrics/pm2:10-alpine

RUN apk add --no-cache git make gcc g++ python
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build-all
EXPOSE 9000
CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--web", "5000" ]
