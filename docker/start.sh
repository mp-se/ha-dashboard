#!/bin/sh
nginx -g "daemon off;" &
node app-server.js
