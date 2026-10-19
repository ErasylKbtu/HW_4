import { useState } from 'react';
import { setNetworkProfile } from '../api/settings.js';
import { failNextRequest } from '../api/fakeApi.js';
import Icon from './Icon.jsx';

export default function NetworkPanel({ onNotice }) {
  const [profile, setProfile] = useState('normal');
  function changeProfile(event) {
    const value = event.target.value;
    setNetworkProfile(value);
    setProfile(value);
    onNotice('Network profile changed. It applies to new requests.', 'info');
  }
  function fail(kind) {
    failNextRequest(kind);
    onNotice(`The next ${kind} request to finish will fail once. Retry afterwards to recover.`, 'info');
  }
  return <details className="network-panel"><summary><Icon name="tune" size={17} />API playground<span>For your demo</span></summary>
    <div className="network-body"><p>Explore how the planner handles slow requests and errors.</p>
      <label>Network profile<select value={profile} onChange={changeProfile}>
        <option value="normal">Normal · 0.4–1.4 s · 6% errors</option>
        <option value="slow">Slow · 1.8–4.2 s · no errors</option>
        <option value="reliable">Reliable · 0.15–0.45 s · no errors</option>
        <option value="offline">Offline simulation · all requests fail</option>
      </select></label>
      <div className="fault-buttons"><button onClick={() => fail('list')}>Fail next list</button><button onClick={() => fail('details')}>Fail next details</button><button onClick={() => fail('write')}>Fail next save</button></div>
      <p className="network-hint">Try switching assignments quickly in Slow mode, or switch to another assignment while completion is pending.</p>
    </div>
  </details>;
}
