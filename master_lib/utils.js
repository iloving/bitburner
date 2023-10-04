import {LOG_LEVEL} from "master_lib/settings.js";

//This function takes a number and converts it into a presentable string
/** @param {NS} ns */
export function abbr_num(ns, val){
  let abbr='';
  let out=-1;
  let v=1;
  let k=v*1000;
  let m=k*1000;
  let b=m*1000;
  let t=b*1000;
  let q=t*1000;
  let qq=q*1000;

  if (val>qq)    {  abbr="Q"; out=val/qq; }
  else if (val>q){  abbr="q"; out=val/q; }
  else if (val>t){  abbr="t"; out=val/t; }
  else if (val>b){  abbr="b"; out=val/b; }
  else if (val>m){  abbr="m"; out=val/m; }
  else if (val>k){  abbr="k"; out=val/k; }
  else {out=val}
  return ns.sprintf("%4.2f%s",out,abbr)
}

/** @param {NS} ns */
export function log(ns, level, output){
  if (level<=LOG_LEVEL){
    ns.print(output);
  }
}

//Like log but outputs to console
/** @param {NS} ns */
export function tlog(ns, level, output){
  if (level<=LOG_LEVEL){
    ns.tprint(output);
  }
}