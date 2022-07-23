FROM node:16-alpine

RUN mkdir -p /usr/src/app
ENV PORT 3000

WORKDIR /usr/src/app

COPY out out
COPY copy.sh copy.sh

CMD [ "/bin/sh", "copy.sh"  ]