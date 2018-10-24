FROM node:8.12.0-alpine

RUN apk add --no-cache make gcc g++ python
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 9000
CMD [ "npm", "start" ]
