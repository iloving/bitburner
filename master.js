/*
MASTER

This script handles all hacking in the game.  It does so by distributing all
hacking operations across every available server that is capable of running
scripts. 
It will periodically re-check the network to see if there are any new servers
we can access. 

It needs to run on a server with 8GB memory

It should be flexible enough to scale to any size, but its probably slow 
in early-game.  
As of this writing, in mid-game, I am getting $217m/sec, and 15k hack exp/sec.
*/
import * as constants from "master_lib/constants.js";
import * as settings from "master_lib/settings.js";
import {log} from "master_lib/utils.js";
import {Server_Manager} from "master_lib/Server_Manager.js";
import {Server} from "master_lib/Server.js";


//The server manager needs to be a global variable cause NS will try to recurse the imports.
let global_manager = null;

/* Main function. It:
-disables all the unnecessary logging
-enumerates the available port apps (currently on initial script load)
-Infinite loop which rediscovers servers and triggers hack attempts.
*/
/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("disableLog");
  ns.disableLog("sleep");
  ns.disableLog("getServerRequiredHackingLevel");
  ns.disableLog("getHackingLevel");
  ns.disableLog("getServerSecurityLevel");
  ns.disableLog("getServerUsedRam");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("getServerMaxMoney");
  ns.disableLog("getServerMinSecurityLevel");
  ns.disableLog("getServerNumPortsRequired");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("scan");
  ns.disableLog("scp");
  ns.disableLog("exec");
  ns.disableLog("getServerGrowth");

  global_manager = new Server_Manager(ns);
  log(ns, constants.LOG_VERBOSE, "Discovering servers...");
  global_manager.discover();
  log(ns, constants.LOG_VERBOSE, "Discovering purchased servers...");
  global_manager.refresh_servers();
  global_manager.print_servers();
  let next_discovery=0;
  let next_hack=0;
  let next_refresh=0;
  while (true) {
    let now=Date.now(); //current timestamp in ms
    if (now >= next_discovery) {
      log(ns,constants.LOG_DEBUG, "Rediscovering ports and servers");
      Server.discover_port_tools();
      next_discovery=now+constants.SECOND*settings.FREQ_DISCOVER;
      global_manager.discover();
    }
    if (now >= next_refresh) {
      log(ns,constants.LOG_DEBUG, "Refreshing servers");
      next_refresh=now+constants.SECOND*settings.FREQ_REFRESH;
      global_manager.refresh_servers();
    }
    if (now >= next_hack) {
      log(ns,constants.LOG_DEBUG, "Hacking servers");
      next_hack=now+constants.SECOND*settings.FREQ_HACK;
      global_manager.hack_servers();
    }

    await ns.sleep(constants.SECOND * settings.FREQ_LOOP)
  }
}




