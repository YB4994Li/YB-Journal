import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { canonicalStrategyName, mergeStrategies, normalizeStrategyKey } from '../services/tradingLibraryService.js';

const withCount={_count:{select:{trades:true}}};
export async function list(req,res){
  const archived=req.query.archived==='true'||req.query.status==='archived';
  success(res,await prisma.strategy.findMany({where:{isArchived:archived},include:withCount,orderBy:{name:'asc'}}),'Strategies retrieved');
}
export async function get(req,res){const strategy=await prisma.strategy.findUnique({where:{id:Number(req.params.id)},include:withCount});if(!strategy)throw new ApiError(404,'Strategy not found');success(res,strategy,'Strategy retrieved');}
export async function create(req,res){
  const normalizedKey=normalizeStrategyKey(req.body.name);
  if(!normalizedKey)throw new ApiError(422,'Strategy name is required');
  const existing=await prisma.strategy.findUnique({where:{normalizedKey}});
  if(existing){if(existing.isArchived)throw new ApiError(409,'This strategy already exists but is archived');return success(res,existing,'Existing canonical strategy reused');}
  const strategy=await prisma.strategy.create({data:{name:canonicalStrategyName(req.body.name),normalizedKey,description:req.body.description?.trim()||null,color:req.body.color?.trim()||null}});
  success(res,strategy,'Strategy created',201);
}
export async function update(req,res){
  const id=Number(req.params.id),existing=await prisma.strategy.findUnique({where:{id}});
  if(!existing)throw new ApiError(404,'Strategy not found');
  const name=req.body.name==null?existing.name:canonicalStrategyName(req.body.name),normalizedKey=normalizeStrategyKey(name);
  const duplicate=await prisma.strategy.findFirst({where:{normalizedKey,id:{not:id}}});
  if(duplicate)throw new ApiError(409,'A strategy with this normalized name already exists; merge them instead');
  const strategy=await prisma.$transaction(async(tx)=>{const updated=await tx.strategy.update({where:{id},data:{name,normalizedKey,...('description'in req.body?{description:req.body.description?.trim()||null}:{}),...('color'in req.body?{color:req.body.color?.trim()||null}:{})}});await tx.trade.updateMany({where:{strategyId:id},data:{strategyName:name}});return updated;});
  success(res,strategy,'Strategy updated');
}
async function archived(req,res,value){const strategy=await prisma.strategy.update({where:{id:Number(req.params.id)},data:{isArchived:value}});success(res,strategy,value?'Strategy archived':'Strategy restored');}
export const archive=(req,res)=>archived(req,res,true);
export const restore=(req,res)=>archived(req,res,false);
export async function merge(req,res){success(res,await prisma.$transaction((tx)=>mergeStrategies(tx,Number(req.body.sourceId),Number(req.body.targetId))),'Strategies merged');}
export async function remove(req,res){const id=Number(req.params.id),count=await prisma.trade.count({where:{strategyId:id}});if(count)throw new ApiError(409,'Only unused strategies can be deleted');await prisma.strategy.delete({where:{id}});success(res,null,'Unused strategy deleted');}
