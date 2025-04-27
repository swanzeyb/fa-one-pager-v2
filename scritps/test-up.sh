#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

PORT=${PORT:-3000}
SERVER_PID=""
SERVER_STARTED_BY_SCRIPT=false
SERVER_LOG_FILE="/tmp/next_server_${PORT}.log"
SERVER_ERR_FILE="/tmp/next_server_${PORT}.err"

# Function to clean up the server process started by *this* script
cleanup() {
  # Check if SERVER_PID is set and refers to a running process group leader
  if [ "$SERVER_STARTED_BY_SCRIPT" = true ] && [ -n "$SERVER_PID" ]; then
      echo "Attempting to shut down Next.js server process group (leader PID: $SERVER_PID)..."
      # Use kill -0 to check if the process group leader exists before trying to kill
      # Check the specific PID, not the group, as setsid makes PID the group leader
      if kill -0 $SERVER_PID 2>/dev/null; then
          # Kill the process group created by setsid using SIGTERM (graceful)
          kill -TERM -- -$SERVER_PID || echo "Warning: Failed to send SIGTERM to server process group $SERVER_PID. It might have already exited."
          echo "Server process group $SERVER_PID signaled for termination."
      else
          echo "Server process group leader (PID: $SERVER_PID) already exited."
      fi
  fi
  # Clean up log files regardless
  echo "Cleaning up log files..."
  rm -f "$SERVER_LOG_FILE" "$SERVER_ERR_FILE"
}

# Register the cleanup function to run on script exit
trap cleanup EXIT SIGINT SIGTERM

echo "Checking if server is listening on port $PORT..."

# Use ss to check if the port is listening. Check if output is non-empty.
if [ -n "$(ss -tuln | grep ":$PORT" || true)" ]; then # Use || true to prevent exit on grep fail
  echo "Server already listening on port $PORT. Proceeding with tests."
else
  echo "Server not listening. Starting Next.js server..."
  # Clean up and create empty log files beforehand
  echo "Preparing log files: $SERVER_LOG_FILE, $SERVER_ERR_FILE"
  rm -f "$SERVER_LOG_FILE" "$SERVER_ERR_FILE"
  touch "$SERVER_LOG_FILE" "$SERVER_ERR_FILE"

  # Ensure the app is built
  echo "Running build..."
  pnpm next build # Let script exit via set -e if build fails

  # Start the server in the background, redirecting output
  echo "Starting Next.js server in background..."
  # setsid ensures it runs in a new session, allowing group kill
  setsid pnpm next start -p $PORT > "$SERVER_LOG_FILE" 2> "$SERVER_ERR_FILE" &
  SERVER_PID=$!
  SERVER_STARTED_BY_SCRIPT=true
  echo "Next.js server process launched with PID: $SERVER_PID (Process Group Leader)."

  # Brief pause to allow the process to potentially fail quickly
  sleep 2

  # Check if the process died immediately
  if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "--------------------------------------------------" >&2
      echo "ERROR: Server process (PID: $SERVER_PID) seems to have exited immediately after starting." >&2
      echo "Server Output Log ($SERVER_LOG_FILE):" >&2
      cat "$SERVER_LOG_FILE" >&2
      echo "--------------------------------------------------" >&2
      echo "Server Error Log ($SERVER_ERR_FILE):" >&2
      cat "$SERVER_ERR_FILE" >&2
      echo "--------------------------------------------------" >&2
      # Reset SERVER_PID so cleanup doesn't try to kill a non-existent process again
      SERVER_PID=""
      exit 1
  fi

  # Wait for the server to be ready using the ss check
  echo "Waiting for server to be ready on port $PORT..."
  export PORT # Export PORT for the subshell
  # Use timeout and loop with the ss check. Add || true to grep inside subshell.
  if ! timeout 60s bash -c 'until [ -n "$(ss -tuln | grep ":$PORT" || true)" ]; do sleep 1; done'; then
      echo "--------------------------------------------------" >&2
      echo "ERROR: Server failed to become ready on port $PORT within 60 seconds." >&2
      echo "Server Output Log ($SERVER_LOG_FILE):" >&2
      cat "$SERVER_LOG_FILE" >&2
      echo "--------------------------------------------------" >&2
      echo "Server Error Log ($SERVER_ERR_FILE):" >&2
      cat "$SERVER_ERR_FILE" >&2
      echo "--------------------------------------------------" >&2
      exit 1
  fi
  echo "Server is ready."
fi

echo "Running tests..."
# Run tests and capture the exit code. Output goes directly to stdout/stderr.
pnpm test:jest
TEST_EXIT_CODE=$?

echo "Tests finished with exit code $TEST_EXIT_CODE."

# Cleanup (stopping server if started) is handled by the trap

# Exit with the test exit code
exit $TEST_EXIT_CODE
