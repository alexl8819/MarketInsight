FROM node:lts-alpine

RUN apk add --no-cache git make gcc g++ python
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9000
# HEALTHCHECK CMD curl --fail http://localhost:5000/ || exit 1
CMD [ "npm", "start" ]
