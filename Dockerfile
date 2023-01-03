FROM node:18
WORKDIR /usr/src
ADD ./dist .
RUN yarn install --production
CMD ["node", "index.js"]
