import { prisma } from '../src/config/prisma.js';
import { normalizeStrategyKey, normalizeTimeframe } from '../src/services/tradingLibraryService.js';

const trades=await prisma.trade.findMany({select:{id:true,strategyName:true,strategyId:true,timeframe:true}});
const strategyGroups=new Map(),timeframes=new Map();
for(const trade of trades){
  const key=normalizeStrategyKey(trade.strategyName);
  if(key){const group=strategyGroups.get(key)||{normalizedKey:key,values:new Set(),tradeIds:[]};group.values.add(trade.strategyName);group.tradeIds.push(trade.id);strategyGroups.set(key,group);}
  if(trade.timeframe){const canonical=normalizeTimeframe(trade.timeframe),group=timeframes.get(canonical)||{canonical,values:new Set(),tradeIds:[]};group.values.add(trade.timeframe);group.tradeIds.push(trade.id);timeframes.set(canonical,group);}
}
console.log(JSON.stringify({
  strategies:[...strategyGroups.values()].map((item)=>({...item,values:[...item.values],tradeCount:item.tradeIds.length})),
  timeframes:[...timeframes.values()].map((item)=>({...item,values:[...item.values],tradeCount:item.tradeIds.length})),
  unassignedStrategyTrades:trades.filter((trade)=>trade.strategyName&&!trade.strategyId).map((trade)=>trade.id)
},null,2));
await prisma.$disconnect();
