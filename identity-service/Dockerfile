# Use the official node.js 18 image with alpine linux as the base image
FROM node:18-alpine as development

# Set the workdir
WORKDIR /usr/src/app

# Copy package.json & package-lock.json files to current workdir
COPY package*.json ./

# Build the dependencies
RUN npm ci --only=production

# Copy the rest of the files in the work dir
# Run this line after run npm ci because the result is cached (for optimization)
COPY . .

# Compile TypeScript before running
RUN npm run build 

EXPOSE 3001

# Run compiled JS file
CMD ["node", "dist/server.js"]