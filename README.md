# bitburner

This repo is a collection of scripts I developed or acquired while playing bitburner.  I'll have to search for them again to find proper attribution, which I'll do at some point. 

## Misc
buyserver.js - script to buy servers

coding.js - script to find coding challenges (citation needed)

deleteserver.js - script to destroy a purchased server

forecasts.js - get the current forecast values for all the stocks

hacknet.js - script to manage purchasing and upgrading of hacknet nodes (citation needed)

karma.js - get your karma

share.js - share your server memory with factions

stock.js - script to manage basic stoke trades (citation needed)

## hacking
This is a set of scripts to automate the hacking of available servers.  It is coded to discover game changes so that you don't need to continuously restart the script, eg:
- Discover all servers on network
- Automatically root servers as your hack skill and available port tools allow it
- uses all available scriptable servers, distributing threads across all available servers automatically

As of this writing, my home server has 8 cores and 64PB RAM, and the script is generator $24 trillion/sec

master.js - master script that runs everything.  Requires a 16GB server to run.  Run with no parameters.

master_lib/settings.js - a bunch of adjustable parameters.

root.js - helper script to root a server

grow.js - helper script to grow a server

hack.js - helper script to hack money from server

weaken.js - helper script to weaken server security

