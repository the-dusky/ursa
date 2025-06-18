FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server files
COPY . .

# Expose port
EXPOSE 1234

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=1234

# Start the server
CMD ["npm", "start"]