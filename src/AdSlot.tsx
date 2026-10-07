import { useEffect, useRef, useState } from 'react';
import { fetchAd, reportAdEvent, type AdCreative, type AdContext } from './ads';

interface AdSlotProps {
  variant: 'passive' | 'interstitial' | 'strip';
  sport?: string;
  tier?: 'free' | 'pro';
  className?: string;
}

// Embedded high-resolution RakOasis logo banner asset
const RAKOASIS_LOGO_SRC = '/rakoasis-banner.png';

const ROTATING_CAMPAIGNS = [
  {
    tag: 'SPONSOR',
    title: 'RAKOASIS',
    cta: 'Sanctuary in the dunes',
    media: RAKOASIS_LOGO_SRC,
    landingUrl: 'https://rakoasis.com',
    themeClass: 'ad-theme-rakoasis',
  },
  {
    tag: 'PRO',
    title: 'SCOREDECK',
    cta: 'SCOREDECK PRO · FROM $5/MONTH · NO ADS',
    media: null,
    landingUrl: 'https://tryscoredeck.pro/#pricing',
    themeClass: 'ad-theme-emerald',
  },
  {
    tag: 'AUDIO',
    title: 'LIVE AUDIO',
    cta: 'LIVE COMMENTARY · 4 LANGUAGES 🎙️',
    media: null,
    landingUrl: 'https://tryscoredeck.pro/#commentary',
    themeClass: 'ad-theme-purple',
  },
  {
    tag: 'APK',
    title: 'MOBILE APK',
    cta: 'SCOREDECK MOBILE · DOWNLOAD APK 📱',
    media: null,
    landingUrl: 'https://tryscoredeck.pro/download',
    themeClass: 'ad-theme-cyan',
  },
];

export default function AdSlot({ variant, sport, tier, className }: AdSlotProps) {
  const [ad, setAd] = useState<AdCreative | null>(null);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const impressionSent = useRef<number | null>(null);

  const ctx: AdContext = {
    variant: variant === 'strip' ? 'passive' : variant,
    sport,
    tier,
    locale: navigator.language?.split('-')[0],
  };

  useEffect(() => {
    let mounted = true;
    fetchAd(ctx).then((next) => {
      if (mounted) setAd(next);
    });
    return () => {
      mounted = false;
    };
  }, [variant, sport, tier]);

  // Coming and going every minute & cycling through campaigns!
  useEffect(() => {
    if (variant !== 'strip') return;

    const cycleTimer = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCampaignIndex((prev) => (prev + 1) % ROTATING_CAMPAIGNS.length);
        setIsVisible(true);
      }, 2500);
    }, 55000);

    return () => clearInterval(cycleTimer);
  }, [variant]);

  // Fire impression exactly once per campaign shown
  useEffect(() => {
    if (!ad) return;
    if (impressionSent.current === ad.campaignId) return;
    impressionSent.current = ad.campaignId;
    reportAdEvent(ad.campaignId, 'impression', ctx);
  }, [ad?.campaignId]);

  if (!ad && variant !== 'strip') return null;

  const currentCampaign = ROTATING_CAMPAIGNS[campaignIndex];

  // RakOasis strictly opens rakoasis.com, Scoredeck strictly opens tryscoredeck.pro
  const targetLandingUrl =
    variant === 'strip'
      ? currentCampaign.landingUrl
      : (ad && !ad.house && ad.landingUrl)
      ? ad.landingUrl
      : currentCampaign.landingUrl;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ad?.campaignId) {
      reportAdEvent(ad.campaignId, 'click', ctx);
    }
    const url = targetLandingUrl;
    console.log('[AdSlot] Navigating to:', url);
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`ad-slot ad-slot-${variant} ${variant === 'strip' ? currentCampaign.themeClass : ''} ${isVisible ? 'ad-visible' : 'ad-hidden'} ${className ?? ''}`}
      onClick={handleClick}
      role="link"
      aria-label="Sponsored Ad"
      title={`Visit ${currentCampaign.landingUrl}`}
    >
      {variant === 'strip' ? (
        <div className="ad-strip-inner">
          <div className="ad-strip-left">
            {currentCampaign.media && (
              <img
                src={currentCampaign.media}
                alt={currentCampaign.title}
                className="ad-strip-media"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <span className="ad-strip-badge">{currentCampaign.tag}</span>
          </div>
          <span className="ad-strip-text">{currentCampaign.cta}</span>
          <span className="ad-strip-arrow-btn" title="Open Site">
            ↗
          </span>
        </div>
      ) : ad?.creativeUrl ? (
        <img src={ad.creativeUrl} alt="Sponsored" draggable={false} />
      ) : variant === 'passive' ? (
        <span className="ad-short">{ad?.short || ad?.subline}</span>
      ) : (
        <div className="ad-text">
          <span className="ad-headline">{ad?.headline}</span>
          {ad?.subline && <span className="ad-subline">{ad.subline}</span>}
        </div>
      )}
      {variant !== 'strip' && <span className="ad-badge">Ad</span>}
    </div>
  );
}
