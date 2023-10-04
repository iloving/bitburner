import * as constants from "master_lib/constants.js";

export const LOG_LEVEL=constants.LOG_VERBOSE;

//How often, in seconds, we run each operation, in seconds
export const FREQ_LOOP=0.01; //how often we loop.  Every other value should be multiple of this
export const FREQ_DISCOVER=60;
export const FREQ_REFRESH=0.1;
export const FREQ_HACK=0.1;

//If the maximum server money isn't at least this much, don't waste time hacking.
export const MIN_MONEY = 1000000;
//Ditto with the server money growth rate
export const MIN_SERVER_GROWTH=10;

//What percentage the servers money should be hacked per attempt.
export const HACK_PERC=0.50;

//What percentage (in decimal format, not %) of the servers money should be grown per attempt.
//This scales the # of growth threads;
export const GROW_PERC=10.0;

//How many gigs to reserve on home
export const HOME_MEM_KEEP=4;

//The max number of servers to try to hack at once
export const HACK_SERVER_COUNT=100;

//The maximum number of hack threads we want to run, no matter what
export const HACK_MAX_THREADS=50;

