FROM node:16-alpine

RUN mkdir -p /usr/src/app
ENV PORT 3000

WORKDIR /usr/src/app

COPY copy.sh copy.sh
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY next.config.js next.config.js
COPY tsconfig.json tsconfig.json
RUN npm install
COPY worker worker
COPY pages pages
COPY types types
COPY public public
COPY lib lib
COPY layouts layouts
COPY components components
COPY styles styles


RUN npm run export

CMD [ "/bin/sh", "copy.sh"  ]