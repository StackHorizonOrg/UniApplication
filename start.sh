#!/bin/sh

./node_modules/.bin/tsx server/jobs/check-updates.ts --cron &
node server.js
