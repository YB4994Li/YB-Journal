import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dashboardPath=new URL('../../client/src/pages/Dashboard.jsx',import.meta.url);
const csvModalPath=new URL('../../client/src/components/csv/CsvImportModal.jsx',import.meta.url);

test('all journal trade mutation paths use the centralized lifecycle refresh',async()=>{
  const source=await readFile(dashboardPath,'utf8');
  assert.match(source,/const refreshJournalData=useCallback/);
  assert.match(source,/await loadAccounts\(\)/);
  assert.match(source,/Promise\.all\(\[refreshSummary\(accountId,phaseId,filters\),loadTrades/);
  assert.equal((source.match(/await refreshJournalData\(\)/g)||[]).length>=4,true);
  assert.match(source,/onImported=\{refreshJournalData\}/);
});

test('CSV import awaits lifecycle refresh before completing its mutation flow',async()=>{
  const source=await readFile(csvModalPath,'utf8');
  assert.match(source,/await onImported\(\)/);
});

test('manual funded phase pass and fail controls are removed',async()=>{
  const [dashboard,settings,routes]=await Promise.all([readFile(dashboardPath,'utf8'),readFile(new URL('../../client/src/components/phase/PhaseSettingsModal.jsx',import.meta.url),'utf8'),readFile(new URL('../src/routes/phaseRoutes.js',import.meta.url),'utf8')]);
  assert.doesNotMatch(settings,/Mark passed|Mark failed|onAction/);
  assert.doesNotMatch(routes,/\/(?:pass|fail|activate)'/);
  assert.doesNotMatch(dashboard,/api\.post\(`\/phases\/\$\{confirm\.item\.id\}\/\$\{confirm\.action\}`/);
});
