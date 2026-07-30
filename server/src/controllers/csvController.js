import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { csvColumns, importRows, parseCsv } from '../services/csvService.js';
import { prisma } from '../config/prisma.js';

export async function preview(req, res) {
  if (!req.file) throw new ApiError(400, 'CSV file is required');
  const account = await prisma.account.findUnique({ where: { id: Number(req.params.accountId) }, select: { id: true,initialCapital:true,breakEvenThresholdPercent:true,currency:true } });
  if (!account) throw new ApiError(404, 'Account not found');
  const phase=req.query.phaseId?await prisma.accountPhase.findFirst({where:{id:Number(req.query.phaseId),accountId:account.id},select:{initialBalance:true,breakEvenThresholdPercent:true}}):null;
  if(req.query.phaseId&&!phase)throw new ApiError(422,'Import phase must belong to the selected account');
  const specifications=await prisma.instrumentSpecification.findMany({where:{isActive:true}});
  success(res, parseCsv(req.file.buffer,{initialCapital:Number(phase?.initialBalance??account.initialCapital),breakEvenThresholdPercent:Number(phase?.breakEvenThresholdPercent??account.breakEvenThresholdPercent),accountCurrency:account.currency,instrumentSpecifications:new Map(specifications.map((item)=>[item.normalizedSymbol,item]))}), 'CSV preview generated successfully');
}
export async function confirm(req, res) {
  const result = await importRows(Number(req.params.accountId), req.body.rows, req.body.sourceSummary, req.body.phaseId);
  success(res, result, `${result.summary.imported} trades imported successfully`, 201);
}
export async function template(req, res) {
  const example = ['London Breakout', 'XAUUSD', '2026-01-03', 'London', '15m', 'BUY', '2642.50', '2637.50', '2652.50', '0.10', '2', '2', '2652.50', '1', 'WIN', '100', 'Patient and focused'];
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="trading-journal-template.csv"');
  res.send(`${csvColumns.map(escape).join(',')}\n${example.map(escape).join(',')}\n`);
}
