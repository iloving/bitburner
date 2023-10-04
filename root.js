const HACK_SSH = "BruteSSH.exe"
const HACK_FTP = "FTPCrack.exe"
const HACK_SMTP = "relaySMTP.exe"
const HACK_HTTP = "HTTPWorm.exe"
const HACK_SQL = "SQLInject.exe"

/** @param {NS} ns */
export async function main(ns) {
  const args = ns.flags([["help", false]]);
  if (args.help || args._.length < 1) {
    ns.tprint("This script roots the specified server");
    ns.tprint(`Usage: run ${ns.getScriptName()} <HOST>`);
    ns.tprint("Example:");
    return (false);
  }
  const server_name = args._[0];
  ns.tprint("Rooting: ", server_name)
  //Have we hacked it already?
  if (ns.hasRootAccess(server_name)) {
    return (true);
  }

  //Do we have the skill to hack it?
  if (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(server_name)) {
    return (false)
  }

  //Break open all available ports
  if (ns.fileExists(HACK_SSH)) { ns.brutessh(server_name) }
  if (ns.fileExists(HACK_FTP)) { ns.ftpcrack(server_name) }
  if (ns.fileExists(HACK_HTTP)) { ns.httpworm(server_name) }
  if (ns.fileExists(HACK_SMTP)) { ns.relaysmtp(server_name) }
  if (ns.fileExists(HACK_SQL)) { ns.sqlinject(server_name) }

  ns.nuke(server_name);

}