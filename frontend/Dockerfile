# Build Stage
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
# Add custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
