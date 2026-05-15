FROM nginx:alpine

# Clean default static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy all app files (including the data/ folder)
COPY . /usr/share/nginx/html

EXPOSE 80