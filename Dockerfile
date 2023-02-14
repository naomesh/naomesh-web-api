FROM node:18-alpine
WORKDIR /app
COPY . /app
RUN npm install
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000/tcp
CMD ["node" , "dist/main.js"]