#!/bin/sh
# Run nginx and the API server; if either stops, stop the other and exit non-zero
# so the container is restarted instead of staying up half-broken.
nginx -e /dev/stderr -g "daemon off;" &
NGINX_PID=$!
node app-server.js &
NODE_PID=$!

stop() {
  kill "$NGINX_PID" "$NODE_PID" 2>/dev/null
  wait
}
trap 'stop; exit 0' TERM INT

while kill -0 "$NGINX_PID" 2>/dev/null && kill -0 "$NODE_PID" 2>/dev/null; do
  sleep 1
done

echo "[ERROR] nginx or the API server exited; stopping container" >&2
stop
exit 1
