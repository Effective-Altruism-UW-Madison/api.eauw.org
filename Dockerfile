FROM node:16

WORKDIR /var/app

COPY package.json /var/app

RUN npm install --force

COPY . /var/app

CMD ["npm", "run", "dev"]
