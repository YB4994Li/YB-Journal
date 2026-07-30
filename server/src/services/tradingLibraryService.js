import { ApiError } from '../utils/ApiError.js';

export const STANDARD_TIMEFRAMES=['M1','M3','M5','M15','M30','M45','H1','H2','H4','H6','H8','H12','D1','W1','MN1'];
export function normalizeStrategyKey(value){return String(value??'').trim().replace(/\s+/g,' ').toLowerCase();}
export function canonicalStrategyName(value){return String(value??'').trim().replace(/\s+/g,' ').replace(/\b\w/g,(letter)=>letter.toUpperCase());}
export function normalizeTimeframe(value){
  const raw=String(value??'').trim().replace(/\s+/g,' ');
  if(!raw)return null;
  const token=raw.toLowerCase().replace(/\s+/g,'');
  if(['daily','1d','d1'].includes(token))return'D1';
  if(['weekly','1w','w1'].includes(token))return'W1';
  if(['monthly','1mo','mn1'].includes(token))return'MN1';
  const minute=token.match(/^(?:m(\d+)|(\d+)(?:m|min|mins|minute|minutes))$/);
  if(minute){const amount=Number(minute[1]||minute[2]);if(amount===60)return'H1';return`M${amount}`;}
  const hour=token.match(/^(?:h(\d+)|(\d+)(?:h|hr|hrs|hour|hours))$/);
  if(hour)return`H${Number(hour[1]||hour[2])}`;
  return raw.toUpperCase();
}
export async function ensureStrategy(db,value){
  const normalizedKey=normalizeStrategyKey(value);
  if(!normalizedKey)return null;
  const existing=await db.strategy.findUnique({where:{normalizedKey}});
  if(existing)return existing;
  return db.strategy.create({data:{name:canonicalStrategyName(value),normalizedKey}});
}
export async function mergeStrategies(db,sourceId,targetId){
  if(sourceId===targetId)throw new ApiError(422,'Source and target strategies must differ');
  const [source,target]=await Promise.all([db.strategy.findUnique({where:{id:sourceId}}),db.strategy.findUnique({where:{id:targetId}})]);
  if(!source||!target)throw new ApiError(404,'Strategy not found');
  const updated=await db.trade.updateMany({where:{strategyId:sourceId},data:{strategyId:targetId,strategyName:target.name}});
  await db.strategy.delete({where:{id:sourceId}});
  return{updatedTrades:updated.count,strategy:target};
}
export function levenshtein(a,b){const x=normalizeStrategyKey(a),y=normalizeStrategyKey(b),row=[...Array(y.length+1).keys()];for(let i=1;i<=x.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=y.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(x[i-1]===y[j-1]?0:1));prev=old;}}return row[y.length];}
export function similarStrategy(value,strategies){const key=normalizeStrategyKey(value);if(key.length<5)return null;return strategies.find((item)=>{const other=normalizeStrategyKey(item.name);return other!==key&&levenshtein(key,other)<=1;})||null;}
