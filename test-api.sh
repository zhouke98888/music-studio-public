#!/bin/bash

echo "Testing Music Studio API..."

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:5000/api/health | jq '.' || echo "Health endpoint test failed"

echo -e "\n\nAPI is ready for testing!"
echo "You can now:"
echo "1. Start the frontend: cd frontend && npm start"
echo "2. Visit http://localhost:3000 to access the application"
echo "3. Register a new account or login"
echo "4. Test the functionality"

echo -e "\n\nDefault test accounts can be created through the registration form."