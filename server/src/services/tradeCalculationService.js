import { calculateInstrumentRisk } from './instrumentCalculationService.js';

const numeric=(value)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const positive=(value)=>numeric(value)&&Number(value)>0;
const round=(value,digits=2)=>Number(Number(value).toFixed(digits));

export function breakEvenThresholdAmount(initialCapital,thresholdPercent=0.05){
  return positive(initialCapital)&&numeric(thresholdPercent)?round(Number(initialCapital)*Number(thresholdPercent)/100):0;
}
export function classifyTradeResult(profitLoss,initialCapital,thresholdPercent=0.05){
  if(!numeric(profitLoss))return null;
  const threshold=breakEvenThresholdAmount(initialCapital,thresholdPercent),pnl=Number(profitLoss);
  if(Math.abs(pnl)<=threshold)return'BREAK_EVEN';
  return pnl>threshold?'WIN':'LOSS';
}
export function calculateTradeAnalytics(data,context={}){
  const warnings=[],entry=Number(data.entryPrice),stop=Number(data.stopLoss),target=Number(data.takeProfit);
  let plannedRR=null;
  if(positive(data.entryPrice)&&positive(data.stopLoss)&&positive(data.takeProfit)&&entry!==stop){
    const riskDistance=Math.abs(entry-stop);
    const rewardDistance=String(data.direction).toUpperCase()==='SELL'?Math.abs(entry-target):Math.abs(target-entry);
    plannedRR=round(rewardDistance/riskDistance);
  }else warnings.push('Planned RR unavailable: valid non-zero entry, stop loss, and take profit are required');

  let riskAmount=positive(data.riskAmount)?round(data.riskAmount):null;
  if(riskAmount===null){
    const instrument=calculateInstrumentRisk({...data,accountCurrency:context.accountCurrency,conversionRates:context.conversionRates,instrumentMetadata:context.instrumentMetadata});
    riskAmount=instrument.riskAmount;if(instrument.warning)warnings.push(`Risk unavailable: ${instrument.warning}`);
  }
  const balance=Number(data.balanceBeforeTrade??context.balanceBeforeTrade);
  const riskPercentage=riskAmount!==null&&Number.isFinite(balance)&&balance>0?round(riskAmount/balance*100):null;
  if(riskPercentage===null)warnings.push('Risk percentage unavailable: reliable risk amount and balance before trade are required');
  const realizedRMultiple=riskAmount!==null&&numeric(data.profitLoss)?round(Number(data.profitLoss)/riskAmount):null;
  if(realizedRMultiple===null)warnings.push('Realized R unavailable: reliable risk amount is required');

  const manualResult=String(data.resultSource||'AUTO').toUpperCase()==='MANUAL';
  const result=manualResult&&['WIN','LOSS','BREAK_EVEN'].includes(data.result)?data.result:classifyTradeResult(data.profitLoss,context.initialCapital,context.breakEvenThresholdPercent);
  const calculated=[plannedRR,realizedRMultiple,riskPercentage].filter((value)=>value!==null).length;
  const manualAnalytics=data.plannedRROverride!=null||data.riskPercentageOverride!=null;
  return{plannedRR,realizedRMultiple,riskAmount,riskPercentage,result,resultSource:manualResult?'MANUAL':'AUTO',calculationStatus:manualAnalytics?'MANUAL':calculated===3?'CALCULATED':calculated?'PARTIAL':'UNAVAILABLE',calculationWarnings:warnings};
}
export function reconstructRealizedBalances(trades,initialBalance){
  let balance=Number(initialBalance);
  return[...trades].sort((a,b)=>new Date(a.closeTimeUtc||a.tradeDate||0)-new Date(b.closeTimeUtc||b.tradeDate||0)||Number(a.tradeNumber||a.rowNumber||0)-Number(b.tradeNumber||b.rowNumber||0)).map((trade)=>{const balanceBeforeTrade=round(balance);balance+=Number(trade.profitLoss||0);return{trade,balanceBeforeTrade};});
}
