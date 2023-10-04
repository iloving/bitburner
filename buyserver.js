/** @param {NS} ns */

const HOSTNAME="hack"

export async function main(ns) {
  const args = ns.flags([["help", false]]);
  if (args.help) {
    ns.tprint("This script buys x servers");
    ns.tprint(`Usage: run ${ns.getScriptName()} <count>`);
    ns.tprint("Example: ${ns.getScriptName()} 10");
    return (false);
  }
  var mem=ns.getPurchasedServerMaxRam();
  var count;
  if (args._.length == 1) { count = args._[0]; }
  else { count=1 }

  var rand;
  var newhost;
  for (var i=0;i<count;i++){
    rand=Math.floor(Math.random() * 999);
    newhost=ns.sprintf("%s%i",HOSTNAME,rand);
    ns.purchaseServer(newhost,mem);
    ns.tprint("Purchased ",newhost);
  }

}