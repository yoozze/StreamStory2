# Build stage
# ===========

FROM node:14.18.1-alpine3.14 AS build-stage

ARG CONFIG
ARG CONFIG_NAME=${CONFIG:-production}
ARG ROOT

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gettext
RUN apk add --no-cache perl

COPY $ROOT/package*.json ./
# RUN npm install
RUN npm ci

# FIXME: This is workaround for compile issues with updated package.json
RUN npm install swagger-ui-express
RUN npm install @types/swagger-ui-express

# Copy project files from host
COPY $ROOT .

# Setup config
COPY ./scripts ./scripts
COPY ./configs ./configs
COPY .en[v] .

RUN source scripts/loadenv.sh .env && \
    format=$(perl -e 'print "\$$_" for grep /^[_a-zA-Z]\w*$/, keys %ENV') && \
    envsubst "$format" < ./configs/$CONFIG_NAME/config.json | tee $CONFIG_NAME.json && \
    node scripts/setupConfig.js api ./$CONFIG_NAME.json > config.json

# Build service
RUN npm run build


# Production stage
# ================

FROM node:14.18.1-alpine3.14

ENV NODE_ENV=production

WORKDIR /app

# Copy from build stage
COPY --from=build-stage /app/build /app
COPY --from=build-stage /app/config.json /app
COPY --from=build-stage /app/package*.json /app/

# Install production dependencies
# RUN npm install --production
RUN npm ci --production

# FIXME: This is workaround for compile issues with updated package.json
RUN npm install swagger-ui-express --production

# Run service
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "export CONFIG=$(cat config.json); node index.js"]
