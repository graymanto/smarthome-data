#from node:9.11-alpine
from arm32v7/node:10-slim
WORKDIR /usr/src/app

COPY package.json ./

RUN apk add --no-cache --virtual .build-deps \
    make gcc g++ python zeromq zeromq-dev \
    && yarn install --production \
    && yarn global add pm2 \
    # Cleanup
    && apk del .build-deps \
    && rm -rf /var/cache/apk/* \
    && rm -rf /root/yarn-cache \
    && rm -rf /tmp/* /root/.cache

COPY src src
COPY process.yml process.yml

EXPOSE 8989

CMD ["pm2-runtime", "process.yml"]
