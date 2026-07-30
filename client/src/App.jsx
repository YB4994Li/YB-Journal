import { Redirect, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import AccountsCenter from './pages/AccountsCenter.jsx';
import TradingLibrary from './pages/TradingLibrary.jsx';

export default function App() {
  return <Switch><Route exact path="/" component={Dashboard}/><Route exact path="/accounts" component={AccountsCenter}/><Route path="/accounts/library" component={TradingLibrary}/><Redirect from="/trading-library" to="/accounts/library"/><Redirect to="/"/></Switch>;
}
