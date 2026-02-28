#!/bin/sh

npx tsx server/jobs/check-updates.ts --cron &
node server.js
