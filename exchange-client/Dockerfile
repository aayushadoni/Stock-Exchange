# Base image
FROM node:18

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (optional, if you want to use in production)
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD npm run start
