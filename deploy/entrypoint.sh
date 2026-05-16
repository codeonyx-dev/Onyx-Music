#!/bin/sh
set -e

/usr/local/bin/onyx-server &
exec nginx -g 'daemon off;'
