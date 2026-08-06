import { useLocation } from 'react-router-dom';
import BreakdownDashboard from './BreakdownDashboard.jsx';

export default function PerformanceBreakdown({rows,currency,sort,setSort,onSelect}){
  const tab=new URLSearchParams(useLocation().search).get('tab')||'markets';
  return <BreakdownDashboard rows={rows} tab={tab} metric={sort} setMetric={setSort} currency={currency} onSelect={onSelect}/>;
}
