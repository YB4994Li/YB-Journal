export const STANDARD_TIMEFRAMES=['M1','M3','M5','M15','M30','M45','H1','H2','H4','H6','H8','H12','D1','W1','MN1'];
export const normalizeStrategyKey=(value)=>String(value??'').trim().replace(/\s+/g,' ').toLowerCase();
export const canonicalStrategy=(value)=>String(value??'').trim().replace(/\s+/g,' ').replace(/\b\w/g,(letter)=>letter.toUpperCase());
export function normalizeTimeframe(value){
  const raw=String(value??'').trim().replace(/\s+/g,' ');if(!raw)return'';
  const token=raw.toLowerCase().replace(/\s+/g,'');
  if(['daily','1d','d1'].includes(token))return'D1';if(['weekly','1w','w1'].includes(token))return'W1';if(['monthly','1mo','mn1'].includes(token))return'MN1';
  const minute=token.match(/^(?:m(\d+)|(\d+)(?:m|min|mins|minute|minutes))$/);if(minute){const amount=Number(minute[1]||minute[2]);return amount===60?'H1':`M${amount}`;}
  const hour=token.match(/^(?:h(\d+)|(\d+)(?:h|hr|hrs|hour|hours))$/);if(hour)return`H${Number(hour[1]||hour[2])}`;
  return raw.toUpperCase();
}
export function editDistance(a,b){const x=normalizeStrategyKey(a),y=normalizeStrategyKey(b),row=[...Array(y.length+1).keys()];for(let i=1;i<=x.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=y.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(x[i-1]===y[j-1]?0:1));previous=old;}}return row[y.length];}
export const similarStrategy=(value,items)=>normalizeStrategyKey(value).length<5?null:items.find((item)=>normalizeStrategyKey(item.value)!==normalizeStrategyKey(value)&&editDistance(value,item.value)<=1);
