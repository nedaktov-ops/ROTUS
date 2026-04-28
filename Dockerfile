FROM node:22-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY webapp/ ./webapp/
COPY database/ ./database/
COPY capacitor.config.json ./

# Create volume for database persistence
VOLUME ["/app/database"]

# Expose the port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "webapp/server.js"]
