FROM node:12.16.2-alpine

# Create app directory
WORKDIR /app

# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
COPY package*.json ./

# # If you are building your code for production
# # RUN npm ci --only=production
RUN npm run

# # Bundle app source
COPY . .

RUN npm i -g nodemon

CMD ["nodemon", "index.js"]