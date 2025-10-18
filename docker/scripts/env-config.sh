#!/bin/sh

# Environment configuration for Angular apps

# Set default values
API_URL=${API_URL:-"http://localhost:3000/api"}
APP_NAME=${APP_NAME:-"LearningHub"}
DEBUG_MODE=${DEBUG_MODE:-"false"}

# Create configuration file
cat > /usr/share/nginx/html/config.js << EOF
window.config = {
  apiUrl: '${API_URL}',
  appName: '${APP_NAME}',
  debugMode: ${DEBUG_MODE},
  production: true
};
EOF

echo "Environment configuration created:"
cat /usr/share/nginx/html/config.js