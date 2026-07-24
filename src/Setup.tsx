import { useState, useEffect } from 'react';
import type { AppConfig, TrackConfig } from './types';
import './Setup.css';

const SPORTS = ['Cricket', 'Football', 'Basketball', 'F1'];

interface SetupProps {
  onComplete: (config: AppConfig) => void;
  initialConfig?: AppConfig | null;
}

export default function Setup({ onComplete, initialConfig }: SetupProps) {
  const [isPro, setIsPro] = useState(initialConfig?.isPro ?? false);
  const [trackedSports, setTrackedSports] = useState<TrackConfig[]>(
    initialConfig?.trackedSports ?? []
  );
  const [startupOnBoot, setStartupOnBoot] = useState(initialConfig?.startupOnBoot ?? true);
  const [visibility, setVisibility] = useState<'always' | 'live-only'>(
    initialConfig?.visibility ?? 'always'
  );
  const [displays, setDisplays] = useState<any[]>([]);
  const [displayId, setDisplayId] = useState(initialConfig?.displayId ?? '');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getDisplays().then((ds: any[]) => {
        setDisplays(ds);
        if (!displayId && ds.length > 0) {
          setDisplayId(ds.find(d => d.isPrimary)?.id ?? ds[0].id);
        }
      });
    }
  }, []);

  const handleSportToggle = (sport: string) => {
    const isSelected = trackedSports.some(t => t.sport === sport);
    if (isSelected) {
      setTrackedSports(trackedSports.filter(t => t.sport !== sport));
    } else {
      if (!isPro && trackedSports.length >= 1) {
        alert('Free tier is limited to 1 sport. Please upgrade to Pro or deselect the current sport.');
        return;
      }
      if (isPro && trackedSports.length >= 4) {
        return;
      }
      setTrackedSports([...trackedSports, { sport, type: 'all' }]);
    }
  };

  const handleConfigChange = (sport: string, type: 'all' | 'league' | 'team' | 'driver', selection?: string) => {
    setTrackedSports(trackedSports.map(t => {
      if (t.sport === sport) return { sport, type, selection };
      return t;
    }));
  };

  const handleSave = () => {
    if (trackedSports.length === 0) {
      alert('Please select at least 1 sport to track.');
      return;
    }
    onComplete({
      isPro,
      trackedSports,
      startupOnBoot,
      displayId,
      visibility
    });
  };

  return (
    <div className="setup-container">
      <h2>Scoredeck Setup</h2>
      
      <div className="setup-section">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={isPro}
            onChange={(e) => {
               setIsPro(e.target.checked);
               if (!e.target.checked && trackedSports.length > 1) {
                  setTrackedSports([trackedSports[0]]); // reduce to 1 if downgraded
               }
            }}
          />
          I have a ScoreDeck Pro subscription
        </label>
        <span className="tier-info">
          {isPro ? 'Pro: Select up to 4 sports' : 'Free: Select 1 sport'}
          {' · '}
          <a
            href="https://tryscoredeck.pro/account"
            onClick={(e) => {
              if (window.electronAPI?.openExternal) {
                e.preventDefault();
                window.electronAPI.openExternal('https://tryscoredeck.pro/account');
              }
            }}
            style={{ color: '#4b9fae', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Manage account
          </a>
        </span>
      </div>

      <div className="setup-section">
        <h3>Select Sports to Track</h3>
        <div className="sports-grid">
          {SPORTS.map(sport => {
            const config = trackedSports.find(t => t.sport === sport);
            return (
              <div key={sport} className={`sport-card ${config ? 'selected' : ''}`}>
                <div className="sport-header" onClick={() => handleSportToggle(sport)}>
                  <input type="checkbox" checked={!!config} readOnly />
                  <span>{sport}</span>
                </div>
                
                {config && (
                  <div className="sport-config">
                    {sport === 'F1' ? (
                      <select 
                        value={config.type} 
                        onChange={(e) => handleConfigChange(sport, e.target.value as any)}
                      >
                        <option value="all">All Drivers (Not Allowed)</option>
                        <option value="driver">Specific Driver</option>
                      </select>
                    ) : (
                      <select 
                        value={config.type}
                        onChange={(e) => handleConfigChange(sport, e.target.value as any)}
                      >
                        <option value="all">All Games</option>
                        <option value="league">Specific League</option>
                        <option value="team">Specific Team</option>
                      </select>
                    )}
                    {config.type !== 'all' && (
                      <input 
                        type="text" 
                        placeholder={config.type === 'driver' ? 'Driver Abbr (e.g. HAM)' : 'Enter name...'} 
                        value={config.selection || ''}
                        onChange={(e) => handleConfigChange(sport, config.type, e.target.value)}
                        className="config-input"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="setup-section">
        <h3>General Settings</h3>
        <label className="settings-row">
          <span>Start on Boot</span>
          <input type="checkbox" checked={startupOnBoot} onChange={e => setStartupOnBoot(e.target.checked)} />
        </label>
        
        <label className="settings-row">
          <span>Visibility</span>
          <select value={visibility} onChange={e => setVisibility(e.target.value as any)}>
            <option value="always">Always Show</option>
            <option value="live-only">Only when tracked match is live</option>
          </select>
        </label>

        <label className="settings-row">
          <span>Display Monitor</span>
          <select value={displayId} onChange={e => setDisplayId(e.target.value)}>
            {displays.map((d) => (
              <option key={d.id} value={d.id}>{d.label || `Display ${d.id}`}</option>
            ))}
          </select>
        </label>
      </div>

      <button className="save-btn" onClick={handleSave}>Save & Launch Widget</button>
    </div>
  );
}
