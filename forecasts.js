// Built upon u/pwillia7 's stock script.
// u/ferrus_aub stock script using simple portfolio algorithm.
/** @param {NS} ns **/
export async function main(ns) {
    var maxSharePer = 1.00
    var stockBuyPer = 0.60
    var stockVolPer = 0.05
    var moneyKeep = 1000000000
    var minSharePer = 5

    ns.disableLog('disableLog');
    ns.disableLog('sleep');
    ns.disableLog('getServerMoneyAvailable');
    var stocks = ns.stock.getSymbols().sort(function(a,b){return ns.stock.getForecast(b) - ns.stock.getForecast(a);})
    for (const stock of stocks) {
        ns.tprint(stock, ": ",ns.stock.getForecast(stock))
    }
}