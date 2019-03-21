FROM node:10.15.3-alpine

RUN apk add --no-cache git make gcc g++ python
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
RUN npm run build-js
RUN npm run build-css
RUN npm run inject-js
RUN npm run inject-css
COPY . .
EXPOSE 9000
CMD [ "npm", "start" ]
