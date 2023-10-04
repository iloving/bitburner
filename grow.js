/** @param {NS} ns */
export async function main(ns) {
  const args = ns.flags([["help", false]]);
  if (args.help) {
    ns.tprint("This script hacks the specified server");
    ns.tprint(`Usage: run ${ns.getScriptName()} [server]`);
    ns.tprint("Example: ${ns.getScriptName()} zer0");
    return (false);
  }

  var host;
  if (args._.length == 1) { host = args._[0]; }
  else { host = ns.getHostname(); }
  ns.print("Growing ",host)
  await ns.grow(host)

}