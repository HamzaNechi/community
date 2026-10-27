FROM node:22-alpine

RUN apk update && apk add --no-cache \
    build-base gcc autoconf automake zlib-dev libpng-dev bash vips-dev git

WORKDIR /srv/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]