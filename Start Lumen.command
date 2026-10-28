#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
LUMEN_NODE="$(command -v node)"
if [ -z "$LUMEN_NODE" ] && [ -x /usr/local/bin/node ]; then LUMEN_NODE=/usr/local/bin/node; fi
if [ -z "$LUMEN_NODE" ] && [ -x /opt/homebrew/bin/node ]; then LUMEN_NODE=/opt/homebrew/bin/node; fi
if [ -z "$LUMEN_NODE" ]; then
  echo 'Node.js is needed to start Lumen Studio. Install Node.js, then open this launcher again.'
  read -r -p 'Press Return to close.'
  exit 1
fi
exec "$LUMEN_NODE" server.mjs --open
