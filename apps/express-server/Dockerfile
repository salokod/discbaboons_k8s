FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S express -u 1001

# Change ownership of app directory
RUN chown -R express:nodejs /app
USER express

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
