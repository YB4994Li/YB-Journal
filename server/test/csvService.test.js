import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCsvFormat, parseCsv } from '../src/services/csvService.js';
import { resolveHeader } from '../src/config/csvHeaderConfig.js';

test('detects an official Exness header set', () => {
  assert.equal(detectCsvFormat([
    'ticket', 'opening_time_utc', 'closing_time_utc', 'type', 'lots',
    'symbol', 'opening_price', 'closing_price', 'stop_loss', 'take_profit', 'profit'
  ]), 'EXNESS');
});

test('maps a winning Exness trade into the application model', () => {
  const csv = [
    'ticket,opening_time_utc,closing_time_utc,type,lots,symbol,opening_price,closing_price,stop_loss,take_profit,profit',
    '921337,2026-07-24 09:15:00,2026-07-24 10:30:00,buy,0.10,XAUUSD,2380.25,2385.75,2375.00,2390.00,55.50'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  const row = preview.rows[0];

  assert.equal(preview.format, 'EXNESS');
  assert.deepEqual(preview.summary, {
    total: 1,
    totalDetected: 1,
    valid: 1,
    invalid: 0,
    skippedEmpty: 0,
    failedRows: 0
  });
  assert.equal(row.valid, true);
  assert.equal(row.data.strategyName, null);
  assert.equal(row.data.importSource, 'EXNESS');
  assert.equal(row.data.market, 'XAUUSD');
  assert.equal(row.data.tradeDate.toISOString().slice(0, 10), '2026-07-24');
  assert.equal(row.data.openTimeUtc.toISOString(), '2026-07-24T09:15:00.000Z');
  assert.equal(row.data.closeTimeUtc.toISOString(), '2026-07-24T10:30:00.000Z');
  assert.equal(row.data.session, 'LONDON');
  assert.equal(row.data.sessionTimezone, 'UTC');
  assert.equal(row.data.sessionDetection, 'AUTO');
  assert.equal(row.data.direction, 'BUY');
  assert.equal(row.data.result, 'WIN');
  assert.equal(row.data.profitLoss, '55.5');
  assert.equal(row.data.entryPrice, '2380.25');
  assert.equal(row.data.exitPrice, '2385.75');
  assert.equal(row.data.stopLoss, '2375');
  assert.equal(row.data.takeProfit, '2390');
  assert.equal(row.data.lotSize, '0.1');
  assert.equal(row.data.plannedRR, 1.86);
  assert.equal(row.data.riskAmount, null);
  assert.equal(row.data.riskPercentage, null);
  assert.equal(row.data.realizedRMultiple, null);
  assert.equal(row.data.emotion, null);
});

test('detects every fixed UTC session boundary from opening time', () => {
  const rows = [
    ['1', '2026-07-24 00:00:00', 'ASIA'],
    ['2', '2026-07-24 07:59:59', 'ASIA'],
    ['3', '2026-07-24 08:00:00', 'LONDON'],
    ['4', '2026-07-24 13:00:00', 'NEW_YORK'],
    ['5', '2026-07-24 21:00:00', 'AFTER_HOURS'],
    ['6', '2026-07-24 23:59:59', 'AFTER_HOURS']
  ];
  const csv = [
    'ticket,opening_time_utc,closing_time_utc,type,lots,symbol,opening_price,closing_price,stop_loss,take_profit,profit',
    ...rows.map(([ticket, open]) => `${ticket},${open},2026-07-25 01:00:00,buy,0.1,EURUSD,1,2,0,0,5`)
  ].join('\n');
  const preview = parseCsv(Buffer.from(csv));
  assert.deepEqual(preview.rows.map((row) => row.data.session), rows.map(([, , session]) => session));
});

test('uses UNKNOWN for an invalid opening timestamp without rejecting an otherwise valid trade', () => {
  const csv = [
    'ticket,opening_time_utc,closing_time_utc,type,lots,symbol,opening_price,closing_price,stop_loss,take_profit,profit',
    '1,not-a-date,2026-07-24 14:00:00,buy,0.1,EURUSD,1,2,0,0,5'
  ].join('\n');
  const row = parseCsv(Buffer.from(csv)).rows[0];
  assert.equal(row.valid, true);
  assert.equal(row.data.openTimeUtc, null);
  assert.equal(row.data.session, 'UNKNOWN');
  assert.equal(row.data.tradeDate.toISOString().slice(0, 10), '2026-07-24');
});

test('derives loss and break-even results from Exness profit', () => {
  const csv = [
    'ticket,opening_time_utc,closing_time_utc,type,lots,symbol,opening_price,closing_price,stop_loss,take_profit,profit',
    '1,24.07.2026 09:15,24.07.2026 10:30,sell,0.20,EURUSD,1.10,1.11,1.12,1.08,-20',
    '2,2026/07/25 09:15,2026/07/25 10:30,buy,0.20,GBPUSD,1.20,1.20,0,0,0'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  assert.equal(preview.rows[0].data.direction, 'SELL');
  assert.equal(preview.rows[0].data.result, 'LOSS');
  assert.equal(preview.rows[1].data.result, 'BREAK_EVEN');
  assert.equal(preview.summary.valid, 2);
});

test('continues to parse the application template format', () => {
  const csv = [
    'strategy,market,date,session,timeframe,direction,entryPrice,stopLoss,takeProfit,lotSize,plannedRR,resultR,exitPrice,riskPercentage,result,profitLoss,emotion',
    'Breakout,NAS100,2026-07-26,New York,5m,SELL,23000,23100,22800,0.5,2,1.5,22850,1,WIN,150,Calm'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  assert.equal(preview.format, 'TEMPLATE');
  assert.equal(preview.rows[0].valid, true);
  assert.equal(preview.rows[0].data.strategyName, 'Breakout');
  assert.equal(preview.rows[0].data.profitLoss, '150');
});

test('reports detailed diagnostics for unrelated CSV files', () => {
  assert.throws(
    () => parseCsv(Buffer.from('name,value\nexample,1')),
    /Recognized format: UNKNOWN.*Missing required fields: opening_time_utc, type, symbol.*Detected headers: name, value/
  );
});

test('normalizes missing, invalid, currency-formatted, and comma-decimal Exness profit', () => {
  const csv = [
    'ticket;opening_time_utc;closing_time_utc;type;lots;symbol;opening_price;closing_price;stop_loss;take_profit;profit',
    '91;2026-07-24 09:15:00;2026-07-24 10:30:00;buy;0.1;XAUUSDm;2380;2381;;;',
    '92;2026-07-24 09:15:00;2026-07-24 10:30:00;sell;0.1;EURUSD.M;1.1;1.2;;;N/A',
    '93;2026-07-24 09:15:00;2026-07-24 10:30:00;buy;0.1;GBPUSD-m;1.1;1.2;;;"MAD 1 234,56"',
    '94;2026-07-24 09:15:00;2026-07-24 10:30:00;sell;0.1;BTCUSD;1;1;;;;- $25.50'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  assert.equal(preview.summary.valid, 4);
  assert.equal(preview.summary.invalid, 0);
  assert.deepEqual(preview.rows.map((row) => row.data.profitLoss), ['0', '0', '1234.56', '-25.5']);
  assert.deepEqual(preview.rows.map((row) => row.data.result), ['BREAK_EVEN', 'BREAK_EVEN', 'WIN', 'LOSS']);
  assert.deepEqual(preview.rows.map((row) => row.data.market), ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD']);
  assert.equal(preview.rows[0].data.originalMarket, 'XAUUSDm');
  assert.equal(preview.rows[0].data.stopLoss, null);
  assert.equal(preview.rows[0].data.takeProfit, null);
});

test('repairs an unquoted comma-decimal profit in the final Exness column', () => {
  const csv = [
    'ticket,opening_time_utc,closing_time_utc,type,lots,symbol,opening_price,closing_price,stop_loss,take_profit,profit',
    '91,2026-07-24 09:15:00,2026-07-24 10:30:00,buy,0.1,XAUUSDm,2380,2381,0,0,12,75'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  assert.equal(preview.rows[0].valid, true);
  assert.equal(preview.rows[0].data.profitLoss, '12.75');
  assert.equal(preview.rows[0].data.result, 'WIN');
});

test('counts empty and non-trade Exness rows instead of silently discarding them', () => {
  const csv = [
    'ticket,opening_time_utc,closing_time_utc,type,lots,symbol,opening_price,closing_price,stop_loss,take_profit,profit',
    '1,2026-07-24,2026-07-24,buy,0.1,XAUUSD,1,2,0,0,5',
    '',
    '2,2026-07-24,2026-07-24,balance,0,,0,0,0,0,100'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  assert.equal(preview.summary.totalDetected, 1);
  assert.equal(preview.summary.valid, 1);
  assert.equal(preview.summary.skippedEmpty, 1);
  assert.equal(preview.summary.failedRows, 1);
  assert.equal(preview.skippedRows.length, 2);
});

test('normalizes case, spaces, underscores, hyphens, and common header aliases', () => {
  assert.equal(resolveHeader('  Ticket ID  '), 'ticket');
  assert.equal(resolveHeader('TICKET'), 'ticket');
  assert.equal(resolveHeader('Open_Time'), 'opening_time_utc');
  assert.equal(resolveHeader('open-time'), 'opening_time_utc');
  assert.equal(resolveHeader('P/L'), 'profit');
  assert.equal(resolveHeader('Net Profit'), 'profit');
  assert.equal(resolveHeader('Instrument'), 'symbol');
});

test('imports a standard MT5 report with duplicate Time and Price columns', () => {
  const csv = [
    'Ticket,Time,Type,Volume,Symbol,Price,S / L,T / P,Time,Price,Commission,Swap,Profit',
    '5001,2026-07-01 09:00:00,buy,0.10,XAUUSDm,2300,2295,2310,2026-07-01 10:00:00,2305,-1.50,-0.20,48.30'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  const trade = preview.rows[0].data;
  assert.equal(preview.format, 'METATRADER');
  assert.equal(trade.importSource, 'MT5');
  assert.equal(trade.tradeDate.toISOString().slice(0, 10), '2026-07-01');
  assert.equal(trade.entryPrice, '2300');
  assert.equal(trade.exitPrice, '2305');
  assert.equal(trade.stopLoss, '2295');
  assert.equal(trade.takeProfit, '2310');
  assert.equal(trade.market, 'XAUUSD');
  assert.equal(trade.profitLoss, '48.3');
});

test('imports FundedNext-style aliases without editing the CSV', () => {
  const csv = [
    'Ticket ID,Open Date,Close Date,Type,Lot,Instrument,Entry Price,Exit Price,SL,TP,Net Profit,Comments',
    'FN-9001,2026-07-02,2026-07-02,SELL,0.25,EURUSD,1.1800,1.1750,1.1850,1.1700,"$125.40",FundedNext trade'
  ].join('\n');

  const preview = parseCsv(Buffer.from(csv));
  const trade = preview.rows[0].data;
  assert.equal(preview.format, 'METATRADER');
  assert.equal(trade.importSource, 'FUNDEDNEXT');
  assert.equal(trade.sourceTradeId, 'FN-9001');
  assert.equal(trade.direction, 'SELL');
  assert.equal(trade.lotSize, '0.25');
  assert.equal(trade.profitLoss, '125.4');
  assert.equal(trade.emotion, 'FundedNext trade');
});

test('missing-header errors list missing fields, detected headers, and recognized format', () => {
  const csv = 'Ticket,Open Time,Type,Profit\n1,2026-07-01,buy,10';
  assert.throws(() => parseCsv(Buffer.from(csv)), (error) => {
    assert.match(error.message, /Missing required fields: symbol/);
    assert.match(error.message, /Detected headers: Ticket, Open Time, Type, Profit/);
    assert.match(error.message, /Recognized format: MT4 \/ MT5 \/ FundedNext/);
    assert.equal(error.errors.length, 3);
    return true;
  });
});
