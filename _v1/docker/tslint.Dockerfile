FROM node:10.15

RUN mkdir /fullstack-one

WORKDIR /fullstack-one

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY tsconfig.json tsconfig.json
COPY tslint.json tslint.json
COPY .prettierignore .prettierignore

COPY index.ts index.ts
COPY packages packages
COPY examples examples

CMD npm run tslint
