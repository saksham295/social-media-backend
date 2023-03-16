FROM node:18-alpine

WORKDIR /code

COPY package.json package.json
COPY package-lock.json package-lock.json

ENV API_PORT=4000
ENV MONGO_URI="mongodb+srv://sakshamjain114:ws9CEdJerwMIc9YH@cluster0.5svjj2d.mongodb.net/reunion"
ENV JWT_SECRET="somesecretkey"

RUN npm ci
COPY . .
RUN npm run test
EXPOSE 8080
CMD [ "node", "index.js" ]
