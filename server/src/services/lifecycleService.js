import { ApiError } from '../utils/ApiError.js';

const amount=(value)=>Number(value||0);
export function realizedLifecycle(initialBalance,currentBalance,profitTargetPercentage,maximumLossPercentage){
  const initial=amount(initialBalance),current=amount(currentBalance);
  const profitTargetAmount=profitTargetPercentage==null?null:initial*amount(profitTargetPercentage)/100;
  const maximumLossAmount=maximumLossPercentage==null?null:initial*amount(maximumLossPercentage)/100;
  const targetBalance=profitTargetAmount==null?null:initial+profitTargetAmount;
  const failureBalance=maximumLossAmount==null?null:initial-maximumLossAmount;
  return{currentRealizedBalance:current,profitTargetAmount,targetBalance,maximumLossAmount,failureBalance,targetProgress:current-initial,remainingBeforeFailure:failureBalance==null?null:current-failureBalance,eligibleToPass:targetBalance!=null&&current>=targetBalance,lossLimitReached:failureBalance!=null&&current<=failureBalance};
}

async function summedBalance(db,where,initial){const sum=await db.trade.aggregate({where,_sum:{profitLoss:true}});return amount(initial)+amount(sum._sum.profitLoss);}

export function determinePhaseSequence(items){let sequenceOpen=true,activeAssigned=false;return items.map((item)=>{let status;if(item.status==='ARCHIVED'){status='ARCHIVED';sequenceOpen=false;}else if(sequenceOpen&&item.eligibleToPass)status='PASSED';else if(sequenceOpen&&item.lossLimitReached){status='FAILED';sequenceOpen=false;}else if(sequenceOpen&&!activeAssigned){status='ACTIVE';activeAssigned=true;sequenceOpen=false;}else status='LOCKED';return{...item,status};});}

export async function reconcileFundedAccountLifecycle(db,accountId){
  const phases=await db.accountPhase.findMany({where:{accountId:Number(accountId)},orderBy:{orderIndex:'asc'}});
  const evaluated=[];
  for(const phase of phases){
    const current=await summedBalance(db,{accountId:phase.accountId,phaseId:phase.id},phase.initialBalance);
    const state=realizedLifecycle(phase.initialBalance,current,phase.profitTargetPercentage,phase.maximumLossPercentage);
    evaluated.push({...phase,...state,currentRealizedBalance:current});
  }
  const planned=determinePhaseSequence(evaluated),results=[],now=new Date();
  for(const phase of planned){const {status}=phase,current=phase.currentRealizedBalance,state=phase;
    const data={currentBalance:String(current),status,passedAt:status==='PASSED'?(phase.passedAt||now):null,failedAt:status==='FAILED'?(phase.failedAt||now):null,endDate:['PASSED','FAILED'].includes(status)?(phase.endDate||now):null,startDate:status==='ACTIVE'?(phase.startDate||now):phase.startDate};
    const updated=await db.accountPhase.update({where:{id:phase.id},data});
    results.push({...updated,...state,status});
  }
  return results;
}

export async function reconcilePhase(db,phaseId){
  const phase=await db.accountPhase.findUnique({where:{id:Number(phaseId)}});if(!phase)throw new ApiError(404,'Phase not found');
  const phases=await reconcileFundedAccountLifecycle(db,phase.accountId);return phases.find((item)=>item.id===phase.id);
}

export async function reconcileRealAccount(db,accountId){const account=await db.account.findUnique({where:{id:Number(accountId)}});if(!account)throw new ApiError(404,'Account not found');const current=await summedBalance(db,{accountId:account.id,phaseId:null},account.initialCapital);const state=realizedLifecycle(account.initialCapital,current,null,account.maximumLossPercentage);if(account.accountType==='REAL'&&account.status==='ACTIVE'&&state.lossLimitReached)await db.account.update({where:{id:account.id},data:{status:'FAILED'}});return{...account,...state,status:account.status==='ACTIVE'&&state.lossLimitReached?'FAILED':account.status};}

export async function assertTradingAllowed(db,{accountId,phaseId}){const account=await db.account.findUnique({where:{id:Number(accountId)}});if(!account)throw new ApiError(404,'Account not found');if(account.accountType==='FUNDED'){if(!phaseId)throw new ApiError(409,'An active funded phase is required');const phases=await reconcileFundedAccountLifecycle(db,account.id),phase=phases.find((item)=>item.id===Number(phaseId));if(!phase)throw new ApiError(422,'Phase must belong to the selected account');if(phase.status!=='ACTIVE')throw new ApiError(409,phase.status==='FAILED'?'Phase failed — maximum loss limit reached.':`Trades cannot be added to a ${phase.status.toLowerCase()} phase.`);return{account,phase};}const state=await reconcileRealAccount(db,account.id);if(state.status!=='ACTIVE')throw new ApiError(409,state.status==='FAILED'?'Account loss limit reached.':'The account must be active to add trades.');return{account:state,phase:null};}
