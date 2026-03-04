FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Standard Nginx config for Port 2020
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 2020
CMD ["nginx", "-g", "daemon off;"]
