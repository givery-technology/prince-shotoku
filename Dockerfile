# Build application
FROM node:12-slim as build-container
WORKDIR /tmp/workspace

COPY package.json .
COPY package-lock.json .
COPY .eslintignore .
COPY .eslintrc.js .
COPY tsconfig.json .
COPY src/ ./src/

RUN npm ci
RUN npm run build

# Install dependencies
FROM node:12-slim as module-container
WORKDIR /tmp/workspace

COPY package.json .
COPY package-lock.json .

RUN npm ci --production

# Container to execute app
FROM node:12-slim as exec-container
WORKDIR /app

COPY --from=build-container /tmp/workspace/package.json ./
COPY --from=build-container /tmp/workspace/package-lock.json ./
COPY --from=build-container /tmp/workspace/dist/ ./dist/
COPY --from=module-container /tmp/workspace/node_modules/ ./node_modules/

ENV NODE_ENV=production HOST=0.0.0.0 NODE_PATH=/app

EXPOSE 9000
CMD ["npm", "run", "start"]
