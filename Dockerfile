# Development build for npm start
FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies first
COPY package*.json ./
RUN npm install

# Copy source files
COPY public/ ./public/
COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 3000
CMD ["npm", "start"]
