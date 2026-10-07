import { useState, useEffect } from 'react';
import type { AppConfig } from './types';
import {
  fetchAllActiveLiveMatches,
  fetchLiveBasketball,
  fetchLiveCricket,
  fetchLiveSoccer,
  type WidgetData,
} from './api';
import AdSlot from './AdSlot';
import { track } from './usage';
import './Widget.css';

interface WidgetProps {
  config: AppConfig;
  onOpenSetup: () => void;
}

export default function Widget({ config, onOpenSetup }: WidgetProps) {
  const [liveMatches, setLiveMatches] = useState<WidgetData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const sports = config.trackedSports?.map((t) => t.sport) || [];
        let matches: WidgetData[] = [];

        if (sports.length === 1 && sports[0] === 'Football') {
          matches = await fetchLiveSoccer();
        } else if (sports.length === 1 && sports[0] === 'Cricket') {
          matches = await fetchLiveCricket();
        } else if (sports.length === 1 && sports[0] === 'Basketball') {
          matches = await fetchLiveBasketball();
        } else {
          matches = await fetchAllActiveLiveMatches();
        }

        if (mounted) {
          if (matches.length > 0) {
            setLiveMatches(matches);
          } else {
            const fallback = await fetchAllActiveLiveMatches();
            setLiveMatches(fallback);
          }
        }
      } catch (err) {
        console.error('Error loading live matches:', err);
      } finally {
        if (mounted) setLoaded(true);
      }
    }

    loadData();

    // Refresh live scores every 12 seconds
    const dataTimer = setInterval(loadData, 12000);

    return () => {
      mounted = false;
      clearInterval(dataTimer);
    };
  }, [config]);

  // Rotate between active live matches every 8 seconds
  useEffect(() => {
    if (liveMatches.length <= 1) return;

    const rotateTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % liveMatches.length);
    }, 8000);

    return () => clearInterval(rotateTimer);
  }, [liveMatches.length]);

  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && data) {
      const league = data.analysis?.find((a) => a.startsWith('League: '))?.slice(8);
      track('match_view', { sport: data.sport, league });
    }
    if (window.electronAPI) {
      if (newExpanded) {
        window.electronAPI.resizeToExpanded();
      } else {
        window.electronAPI.resizeToWidget(config);
      }
    }
  };

  const data = liveMatches[currentIndex] || liveMatches[0];

  if (!data && loaded) {
    return (
      <div className="widget-wrapper">
        <div className="widget-main">
          <div className="content-row">
            <div className="sport-dot" style={{ backgroundColor: '#444' }} />
            <div className="main-info">
              <span className="team">No live matches right now</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
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

  return (
    <div className={`widget-wrapper ${isExpanded ? 'expanded' : ''}`}>
      
      {/* ── 1. TOP SCORE PILL ── */}
      <div className="widget-main">
        <div className="content-row">
          {/* Home Team (Left): Crest -> Name */}
          <div className="team-container team-home">
            {data.homeBadge && (
              <img
                src={data.homeBadge}
                alt={data.team1}
                className="team-badge"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <span className="team">{data.team1}</span>
          </div>

          {/* Live Score (Dead Center) */}
          <div className="score-container">
            <span className="score">{data.score}</span>
          </div>

          {/* Away Team: Name -> Crest */}
          <div className="team-container team-away">
            <span className="team">{data.team2}</span>
            {data.awayBadge && (
              <img
                src={data.awayBadge}
                alt={data.team2}
                className="team-badge"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Status & Controls (Right): Dot -> HT/FT -> Controls */}
          <div className="match-status-block">
            <div className="sport-dot" style={{ backgroundColor: data.color }} />
            <div className="extra-info">{data.extra}</div>

            <div className="controls">
              <button className="icon-btn" onClick={toggleExpand} title="Expand Analysis">
                 {isExpanded ? '▲' : '▼'}
              </button>
              <button className="icon-btn" onClick={onOpenSetup} title="Settings">⚙</button>
            </div>
          </div>
        </div>
        
        <div className="bottom-line" style={{ backgroundColor: data.color, width: data.progress }} />
      </div>

      {/* ── 2. BOTTOM AD PILL (Vibrant, distinct, with background and clickable arrow) ── */}
      <AdSlot
        variant="strip"
        sport={data.sport}
        tier={config.isPro ? 'pro' : 'free'}
      />

      {isExpanded && (
        <div className="expanded-analysis">
           <div className="analysis-header">
              <span style={{color: data.color}}>Match Details</span> - {data.sport}
           </div>
           <div className="analysis-content">
              {data.analysis && data.analysis.length > 0 ? (
                data.analysis.map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))
              ) : (
                <p>Live match telemetry active.</p>
              )}
           </div>
           <AdSlot
             variant="interstitial"
             sport={data.sport}
             tier={config.isPro ? 'pro' : 'free'}
             className="expanded-ad"
           />
        </div>
      )}
    </div>
  );
}
