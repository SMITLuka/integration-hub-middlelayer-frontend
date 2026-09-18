# Stage 1: build the Angular application (production configuration, AOT + optimization).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: serve the built static assets with nginx.
# Angular 19's application builder nests the browser bundle under dist/<project>/browser.
FROM nginx:alpine
COPY --from=build /app/dist/integration-hub-middlelayer-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
