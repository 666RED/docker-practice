# Use the official node.js 18 image with alpine linux as the base image
FROM node:18-alpine AS development

# Set the workdir
WORKDIR /usr/src/app

# Copy package.json & package-lock.json files to current workdir
COPY package*.json ./

# Build the dependencies
RUN npm ci

# Copy the rest of the files in the work dir
# Run this line after run npm ci because the result is cached (for optimization)
COPY . .

# Compile TypeScript before running
RUN npm run build 

# Production stage
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy only necessary files from the build stage
COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/dist ./dist

# Install only production dependencies
RUN npm ci --only=production

EXPOSE 3002

# Run compiled JS file
CMD ["node", "dist/server.js"]