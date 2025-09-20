#!/bin/bash

# build code
npm run build-staging

# đẩy code build lên server
rsync -avz dist ubuntu@34.142.177.104:/tmp/

# di chuyển code build vào thư mục nginx
ssh ubuntu@34.142.177.104 \
'sudo rm -rf /var/www/html/chat-staging-dev && sudo mv /tmp/dist /var/www/html/chat-staging-dev'