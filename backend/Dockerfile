# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose port
EXPOSE 5000

# Create uploads directory
RUN mkdir -p ./uploads

# Start the server
CMD ["node", "server.js"] 