FROM node:lts-alpine

RUN apk add --no-cache git make gcc g++ python
WORKDIR /usr/src/app
COPY . .
RUN npm install -g pm2
RUN npm install
RUN npm run build-all
EXPOSE 9000
CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production" ]
