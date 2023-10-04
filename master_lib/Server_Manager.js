import * as constants from "/master_lib/constants.js";
import * as settings from "/master_lib/settings.js";
import { Server } from "/master_lib/Server.js";
import { abbr_num, log, tlog } from "/master_lib/utils.js";

//Performs game-wide coordination of all servers
export class Server_Manager {
  static ns = null;
  /** @param {NS} ns */
  static set ns(ns) {
    if (Server.ns == null) {
      Server.ns = ns
    }
  }

  /** @param {NS} ns */
  constructor(ns) {
    log(ns,constants.LOG_DEBUG,"Creating manager");
    //all servers in the game
    this.all_servers = new Object();
    //servers that are rooted and have money
    this.servers_worth_hacking = new Object();
    //servers that are rooted and can run scripts
    this.usable_servers = new Object();
    Server_Manager.ns = ns;
    this.total_mem_max = 0;
    this.total_mem_free=0;

    //Used to help with thread calculations;
    //Since most of the threads are going to be running on home, the calc will be home centric.
    this.home_cores=1;
  }

  //Scan network and find all servers, starting with home
  discover(name = null, parent = null) {
    if (name == null) {
      log(Server_Manager.ns,constants.LOG_DEBUG,Server_Manager.ns.sprintf("No server specified.  Using %s",constants.HOME_SERVER));
      name = constants.HOME_SERVER;
    }

    log(Server_Manager.ns,constants.LOG_DEBUG,Server_Manager.ns.sprintf("Evaluating Server: %s",name));
    this.add_server(new Server(Server_Manager.ns, name));
    
    let children = Server_Manager.ns.scan(name);
    for (var child of children) {
      if (child == parent) {
        continue
      }
      this.discover(child, name);
    }
  }

  //Update the metrics for each server and determine if it can be hacked/used.
  refresh_servers() {
    Server.discover_port_tools();
    this.servers_worth_hacking = new Object();
    this.usable_servers = new Object();
    this.total_mem_max = 0;
    this.total_mem_free=0

    for (var h of Object.keys(this.all_servers)) {
      var server = this.all_servers[h];
      server.refresh();

      if (server.owned) {
        this.usable_servers[h] = server;
        if (Server_Manager.home_cores<server.cpu_cores){
          Server_Manager.home_cores=server.cpu_cores;
        }
        continue;
      }
      if (server.rooted) {
        //Skip servers with no money or a very poor growth factor
        if (server.money_max >= settings.MIN_MONEY && server.growth_rate>=settings.MIN_SERVER_GROWTH) {
          this.servers_worth_hacking[h] = server;
        }
        //If it has memory, we can used it
        if (server.mem_max > 2) {
          //Server_Manager.ns.tprint("Server:",server);
          this.total_mem_max += server.mem_max;
          this.total_mem_free+= server.mem_free;
          this.usable_servers[h] = server;
        }
      }
      else {
        if (this.all_servers[h].root()) {
          //Server_Manager.ns.tprint(h, " rooted.")
        }
      }
    }
  }

  add_server(server) {
    if (!(server instanceof Server)) {
      return;
    }
    if (this.server_known(server.name)) {
      return;
    }
    let n=Server_Manager.ns;
    tlog(n, constants.LOG_BASIC, n.sprintf("Adding new server: %20s (MM: %5s, RAM: %5s, GR: %5s )", server.name, abbr_num(n, server.money_max), abbr_num(n,server.mem_max), abbr_num(n, server.growth_rate)));
    this.all_servers[server.name] = server;
  }

  server_known(name) {
    var found = (Object.keys(this.all_servers).includes(name))
    /*
        if (found) {
          Server_Manager.ns.tprint("Found ", name)
        }
        else {
          Server_Manager.ns.tprint("Missing ", name)
        }
    */
    return (found)
  }

  print_servers() {
    this.print_servers_helper("All Servers", this.all_servers)
    this.print_servers_helper("Hackable Servers", this.servers_worth_hacking)
    this.print_servers_helper("Scriptable Servers", this.usable_servers)
  }
  print_servers_helper(title, obj) {
    var host;
    //Server_Manager.ns.tprint(this.all_servers);
    //Server_Manager.ns.tprint(title, ":")
    for (var k of Object.keys(obj)) {
      host = this.all_servers[k];

      log(Server_Manager.ns, constants.LOG_VERBOSE, {
        "name": k,
        "mem": host.mem_max,
        "money": host.money_max,
        "rooted": host.rooted,
        "owned": host.owned
      })
    }
  }

  //trigger a hacking attempt on all earmarked servers
  hack_servers() {
    //sort the hackable servers by max money
    var items = Object.keys(this.servers_worth_hacking).map((key) => { return [key, (this.servers_worth_hacking[key].money_max)] });
    items.sort((first, second) => { return second[1] - first[1] });
    var keys = items.map((e) => { return e[0] }).slice(0,settings.HACK_SERVER_COUNT);
    //Server_Manager.ns.print("hacking: ",keys)
    //hack as many servers as we can
    for (var k of keys) {
      var host = this.servers_worth_hacking[k];
      host.hack_server(this);
    }
    log(Server_Manager.ns, constants.LOG_DEBUG, "----")
  }

  //Distributes the desired command across all available nodes.
  //returns the # of threads it successfully started, or desired count
  //if it's negative.
  distribute_cmd(target_server, cmd, threads_wanted) {

    var threads_started = 0
    var server_num = 0
    var script_mem = Server_Manager.ns.getScriptRam(cmd);
    var workers = Object.keys(this.usable_servers);
    var worker;
    var total_mem;

    if (threads_wanted <= 0) {
      //If the count is <, then a shortcircuit happened and we return the same value so
      //the calling function can handle it accordingly.
      return (threads_wanted);
    }
    //log(Server_Manager.ns, constants.LOG_DEBUG, Server_Manager.ns.sprintf("Distributing %i x %s on %s", threads_wanted, cmd, target_server));
    while (threads_started < threads_wanted && server_num < workers.length) {
      worker = this.usable_servers[workers[server_num]];
      worker.refresh();
      var avail_threads = Math.floor(worker.mem_free / script_mem);
      if (avail_threads > 0) {
        //If we can run more threads than we need, cut off at what we need
        if (avail_threads > (threads_wanted - threads_started)) {
          avail_threads = threads_wanted - threads_started;
        }

        Server_Manager.ns.exec(cmd, worker.name, avail_threads, target_server);
        threads_started += avail_threads;
      }
      server_num++;
    }
    if (threads_started < threads_wanted) {
      log(Server_Manager.ns, constants.LOG_DEBUG, "Insufficient resources to run.");
    }
    return threads_started;
  }
}