# Use an official Node.js runtime as a parent image
FROM node:18 AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install TypeScript and compile the code
RUN npm install -g typescript
RUN tsc

# # Production stage
# FROM node:18-alpine

# # Set the working directory in the container
# WORKDIR /usr/src/app

# # Copy the compiled JavaScript code and package.json files
# COPY --from=builder /usr/src/app/dist ./dist
# COPY --from=builder /usr/src/app/package*.json ./

# # Install only production dependencies
# RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 3001

# Command to run the app
CMD ["node", "dist/index.js"]
