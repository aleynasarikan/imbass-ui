FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose server port
EXPOSE 5002

# Run development server
CMD ["npm", "run", "server:dev"]
