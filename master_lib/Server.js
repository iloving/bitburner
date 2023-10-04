import * as constants from "/master_lib/constants.js";
import * as settings from "/master_lib/settings.js";
import { abbr_num, log, tlog } from "/master_lib/utils.js";

//Class for handling individual servers
export class Server {
  static openable_ports;
  static ns;

  static discover_port_tools() {
    //If we already have all of them, no point checking if there are any new ones.
    if (Server.openable_ports < constants.HACK_MAX_SCRIPTS) {
      let openable_ports = 0;
      if (Server.ns.fileExists(constants.HACK_SSH)) { openable_ports++ }
      if (Server.ns.fileExists(constants.HACK_FTP)) { openable_ports++ }
      if (Server.ns.fileExists(constants.HACK_HTTP)) { openable_ports++ }
      if (Server.ns.fileExists(constants.HACK_SMTP)) { openable_ports++ }
      if (Server.ns.fileExists(constants.HACK_SQL)) { openable_ports++ }
      if (openable_ports != Server.openable_ports) {
        log(Server.ns, constants.LOG_VERBOSE, Server.ns.sprintf("New openable ports: %i", openable_ports));
      }
    }
  }
  /** @param {NS} ns */
  static set ns(ns) {
    if (Server.ns == null) {
      Server.ns = ns
    }
  }

  name = "";
  owned = false;
  money_max = -1;
  money_curr = -1;
  security_min = -1;
  security_curr = -1;
  mem_max = -1;
  mem_free = -1;
  growth_rate=-1;
  rooted = false;

  /** @param {NS} ns */
  constructor(ns, name) {
    Server.ns = ns;
    log(ns, constants.LOG_DEBUG, ns.sprintf("Creating Server: %s",name));
    let server = ns.getServer(name);
    this.name = name;
    this.owned = server.purchasedByPlayer;
    this.money_max = server.moneyMax;
    this.security_min = Server.ns.getServerMinSecurityLevel(this.name);
    this.mem_max = server.maxRam;
    this.hack_skill_req = server.requiredHackingSkill;
    this.hack_ports_req = server.numOpenPortsRequired;
    this.cpu_cores=server.cpuCores;
    this.growth_rate=server.serverGrowth;
  }

  //Update changing server metrics and copy the hacks scripts over
  //(even if the server can't run scripts, cause screw it)
  refresh() {
    let server = Server.ns.getServer(this.name);
    this.mem_max = server.maxRam;    //need this for when home is upgraded
    this.money_curr = server.moneyAvailable;
    this.security_curr = server.hackDifficulty;
    this.mem_free = this.mem_max - server.ramUsed;
    if (this.name==constants.HOME_SERVER){
      this.mem_free-=settings.HOME_MEM_KEEP;
    }
    this.rooted = server.hasAdminRights;
    Server.ns.scp([constants.SCRIPT_HACK, constants.SCRIPT_GROW, constants.SCRIPT_WEAKEN, constants.SCRIPT_ROOT], this.name);
    log(Server.ns, constants.LOG_DEBUG, Server.ns.sprintf("Refreshed: %s", this.name));
  }
  refresh_money(){
    let server = Server.ns.getServer(this.name);
    this.money_curr = server.moneyAvailable;
    this.security_curr = server.hackDifficulty;
    log(Server.ns, constants.LOG_DEBUG, Server.ns.sprintf("Refreshed money: %s", this.name));

  }


  //gain root access to server if we don't already have it
  /** @param {NS} ns */
  root() {
    if (this.owned) {
      this.rooted = true;
      return (true)
    }
    if (this.rooted) {
      return (true);
    }
    if (Server.ns.getHackingLevel() < this.hack_skill_req) {
      return (false);
    }
    if (this.hack_ports_req > openable_ports) {
      return (false);
    }
    Server.ns.tprint("Rooting: ", this.name)

    result_h = manager.distribute_cmd(this.name, SCRIPT_ROOT, 1);

  }

  //Initiates the various hacking operations against the server
  //It assumes the best possible state for hacking, and runs an appropriate number of
  //weakens and grows to make sure the server stays close to that state as possible.
  /** @param {NS} ns */
  hack_server(manager) {
    var result_w = -1;
    var result_g = -1;
    var result_h = -1;
    let mem_hack=Server.ns.getScriptRam(constants.SCRIPT_HACK);
    let mem_grow=Server.ns.getScriptRam(constants.SCRIPT_GROW);
    let mem_weak=Server.ns.getScriptRam(constants.SCRIPT_WEAKEN);

    //If the server has little money, don't bother
    if (this.money_max < settings.MIN_MONEY) {
      return;
    }
    this.refresh_money();
    //Start with deciding how many hack threads we want to run.  We will run as many hacks as we have memory
    //hackAnalyzeThreads returns -1 if the server doesn't have enough money so we can't use this.
    //let hack_threads=Server.ns.hackAnalyzeThreads(this.name, this.money_max*settings.HACK_PERC);
    let hack_pct=Server.ns.hackAnalyze(this.name);
    let hack_threads=this.money_max*settings.HACK_PERC/(this.money_max*hack_pct);
    if (settings.HACK_MAX_THREADS < hack_threads) {
      //no point exceeding this many threads per invocation
      hack_threads = settings.HACK_MAX_THREADS;
    }

    //Figure out the growth multipier to restore the amount money back
    //Since it's a multiple of what's already on the server, we can't be sure the current amount at any given time
    //so we pad it just in case
    let growth_multiplier=1*settings.GROW_PERC/settings.HACK_PERC;
    let grow_threads = Server.ns.growthAnalyze(this.name, growth_multiplier, manager.home_cores);

    let sec_rate_hack=Server.ns.hackAnalyzeSecurity(1, this.name);
    let sec_rate_weaken=Server.ns.weakenAnalyze(1, manager.home_cores);
    let sec_rate_grow=Server.ns.growthAnalyzeSecurity(1, this.name, manager.home_cores);


    //How many weakens would we need to undo the security changes caused by hack and grow
    let weaken_threads = (grow_threads * sec_rate_grow + hack_threads + sec_rate_hack) / sec_rate_weaken;
    log(Server.ns, constants.LOG_DEBUG, Server.ns.sprintf("Desired threads for %s:, %i x hack, %i x grow, %i x weaken ", this.name, Math.floor(hack_threads),Math.floor(grow_threads),Math.floor(weaken_threads)));

    let mem_cost=mem_hack*hack_threads+mem_grow*grow_threads+mem_weak*weaken_threads;
    if (mem_cost>manager.total_mem_max){
      let shrink_factor=manager.total_mem_max/mem_cost;
      hack_threads*=shrink_factor;
      grow_threads*=shrink_factor;
      weaken_threads*=shrink_factor;
      if (hack_threads<1) {hack_threads=1;}
      if (grow_threads<1) {grow_threads=1;}
      if (weaken_threads<1) {weaken_threads=1;}
    }
    hack_threads=Math.floor(hack_threads);
    grow_threads=Math.floor(grow_threads);
    weaken_threads=Math.floor(weaken_threads);

    result_h = manager.distribute_cmd(this.name, constants.SCRIPT_HACK, hack_threads);
    result_g = manager.distribute_cmd(this.name, constants.SCRIPT_GROW, grow_threads);
    result_w = manager.distribute_cmd(this.name, constants.SCRIPT_WEAKEN, weaken_threads);

    log(Server.ns, constants.LOG_VERBOSE, Server.ns.sprintf("Hacking %17s for (%3i/%3i)H, (%5i/%5i)G, (%4i/%4i)W", this.name,
      result_h,hack_threads,result_g,grow_threads,result_w,weaken_threads));
    

  }

  //returns basic stats on the server, compacted to save logging linespace,
  //you can optionally add an additional string.
  stats(more = "") {
    Server.ns.printf("%17s: SM%s SC%s MM%s MC%s %s",
      this.name,
      abbr_num(this.ns, this.security_min),
      abbr_num(this.ns, this.security_curr),
      abbr_num(this.ns, this.money_max),
      abbr_num(this.ns, this.money_curr),
      more
    )
  }
}