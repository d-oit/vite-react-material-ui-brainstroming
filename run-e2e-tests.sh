#!/bin/bash
# Start the dev server in the background
npm run dev &
DEV_PID=$!

# Wait for the server to start
echo "Waiting for dev server to start..."
sleep 10

# Run the tests and save the output to a report file
echo "Running Playwright tests..."
npm run test:e2e -- --reporter=list > playwright-report.txt 2>&1
TEST_EXIT_CODE=$?

# Kill the dev server
echo "Stopping dev server..."
kill $DEV_PID

# Exit with the test exit code
exit $TEST_EXIT_CODE
