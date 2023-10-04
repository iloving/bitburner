/** @param {NS} ns */
export async function main(ns) {
  const args = ns.flags([["help", false]]);
  if (args.help) {
    ns.tprint("This script buys x servers");
    ns.tprint(`Usage: run ${ns.getScriptName()} <count>`);
    ns.tprint("Example: ${ns.getScriptName()} 10");
    return (false);
  }
  var host;
  if (args._.length == 1) { host = args._[0]; }
  else {return -1}

  ns.deleteServer(host);
  
}