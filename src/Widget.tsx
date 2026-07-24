import { useState, useEffect } from 'react';
import type { AppConfig, TrackConfig } from './types';
import { fetchSportData } from './api';
import AdSlot from './AdSlot';
import './Widget.css';

interface WidgetProps {
  config: AppConfig;
  onOpenSetup: () => void;
}

export default function Widget({ config, onOpenSetup }: WidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [widgetData, setWidgetData] = useState<any>(null);

  const trackedSports: TrackConfig[] = config.trackedSports.length > 0 ? config.trackedSports : [{ sport: 'Cricket', type: 'all' }];
  const currentConfig = trackedSports[currentIndex];

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const data = await fetchSportData(currentConfig.sport, currentConfig);
      if (mounted) {
        setWidgetData(data);
      }
    }

    loadData();

    // Refresh data every 10 seconds while on the same sport
    const dataTimer = setInterval(loadData, 10000);

    return () => {
      mounted = false;
      clearInterval(dataTimer);
    };
  }, [currentConfig]);

  useEffect(() => {
    if (trackedSports.length <= 1) return;
    
    // Rotate sports every 8 seconds
    const rotateTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trackedSports.length);
    }, 8000);
    
    return () => clearInterval(rotateTimer);
  }, [trackedSports.length]);

  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (window.electronAPI) {
      if (newExpanded) {
        window.electronAPI.resizeToExpanded();
      } else {
        window.electronAPI.resizeToWidget(config);
      }
    }
  };

  if (!widgetData) {
    return (
      <div className="widget-wrapper">
        <div className="widget-main">
          <div className="content-row">
            <div className="sport-dot skeleton-pulse" style={{ backgroundColor: '#444' }} />
            <div className="main-info">
              <span className="team skeleton-pulse skeleton-team" />
              <span className="score skeleton-pulse skeleton-score" />
              <span className="team skeleton-pulse skeleton-team" />
            </div>
            <div className="divider" />
            <span className="extra-info skeleton-pulse skeleton-extra" />
          </div>
          <div className="bottom-line skeleton-pulse" style={{ width: '30%', backgroundColor: '#444' }} />
        </div>
      </div>
    );
  }

  const data = widgetData;

  return (
    <div className={`widget-wrapper ${isExpanded ? 'expanded' : ''}`}>
      <div className="widget-main">
        <div className="content-row">
          <div className="sport-dot" style={{ backgroundColor: data.color }} />
          
          <div className="main-info">
            <span className="team">{data.team1}</span>
            <span className="score">{data.score}</span>
            <span className="team">{data.team2}</span>
          </div>

          <div className="divider" />

          <div className="extra-info">{data.extra}</div>

          <div className="nav-dots">
            {trackedSports.map((_, index) => (
              <div key={index} className={`nav-dot ${index === currentIndex ? 'active' : ''}`} />
            ))}
          </div>

          <AdSlot
            variant="passive"
            sport={currentConfig.sport}
            tier={config.isPro ? 'pro' : 'free'}
          />

          {/* Controls */}
          <div className="controls">
            <button className="icon-btn" onClick={toggleExpand} title="Expand Analysis">
               {isExpanded ? '▲' : '▼'}
            </button>
            <button className="icon-btn" onClick={onOpenSetup} title="Settings">⚙</button>
          </div>
        </div>
        
        <div className="bottom-line" style={{ backgroundColor: data.color, width: data.progress }} />
      </div>

      {isExpanded && (
        <div className="expanded-analysis">
           <div className="analysis-header">
              <span style={{color: data.color}}>Deeper Analysis</span> - {currentConfig.sport}
           </div>
           <div className="analysis-content">
              {data.analysis && data.analysis.length > 0 ? (
                data.analysis.map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))
              ) : (
                <p>No deeper analysis available.</p>
              )}
           </div>
           <AdSlot
             variant="interstitial"
             sport={currentConfig.sport}
             tier={config.isPro ? 'pro' : 'free'}
             className="expanded-ad"
           />
        </div>
      )}
    </div>
  );
}
