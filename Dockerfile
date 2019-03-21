FROM node:10.15.3-alpine

RUN apk add --no-cache git make gcc g++ python
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9000
CMD [ "npm", "start" ]
