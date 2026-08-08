import { Redirect, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import AccountsCenter from './pages/AccountsCenter.jsx';
import TradingLibrary from './pages/TradingLibrary.jsx';
import PerformanceCenter from './pages/PerformanceCenter.jsx';
import TradingCalendar from './pages/TradingCalendar.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

export default function App() {
  return <AppLayout><Switch><Redirect exact from="/" to="/journal"/><Route exact path="/journal" component={Dashboard}/><Route exact path="/performance" component={PerformanceCenter}/><Route exact path="/calendar" component={TradingCalendar}/><Route exact path="/daily-notes" render={() => <ComingSoon name="Daily Notes" accountRequired/>}/><Route exact path="/accounts" component={AccountsCenter}/><Route path="/accounts/library" component={TradingLibrary}/><Route exact path="/trades/:tradeId" render={() => <ComingSoon name="Trade Details" accountRequired/>}/><Route exact path="/settings" render={() => <ComingSoon name="Settings"/>}/><Redirect from="/trading-library" to="/accounts/library"/><Redirect to="/journal"/></Switch></AppLayout>;
}
