# Base image
FROM node:18

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Seed and refresh the views during startup
CMD ["bash", "-c", "npm run dev && npm run seed:db && npm run refresh:views"]
