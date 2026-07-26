import { useEffect, useRef, useState } from 'react';
import { fetchAd, reportAdEvent, type AdCreative, type AdContext } from './ads';

interface AdSlotProps {
  // 'strip' is the sponsor line under the widget bar; the server treats it as
  // passive inventory.
  variant: 'passive' | 'interstitial' | 'strip';
  sport?: string;
  tier?: 'free' | 'pro';
  className?: string;
}

export default function AdSlot({ variant, sport, tier, className }: AdSlotProps) {
  const [ad, setAd] = useState<AdCreative | null>(null);
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
    // Re-fetch when context changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, sport, tier]);

  // Fire impression exactly once per campaign shown
  useEffect(() => {
    if (!ad) return;
    if (impressionSent.current === ad.campaignId) return;
    impressionSent.current = ad.campaignId;
    reportAdEvent(ad.campaignId, 'impression', ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad?.campaignId]);

  if (!ad) return null;

  const handleClick = () => {
    reportAdEvent(ad.campaignId, 'click', ctx);
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(ad.landingUrl);
    } else {
      window.open(ad.landingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`ad-slot ad-slot-${variant} ${className ?? ''}`}
      onClick={handleClick}
      role="link"
      aria-label="Sponsored"
      title="Sponsored"
    >
      {variant === 'strip' ? (
        <span className="ad-strip-text">{ad.subline || ad.short}</span>
      ) : ad.creativeUrl ? (
        <img src={ad.creativeUrl} alt="Sponsored" draggable={false} />
      ) : variant === 'passive' ? (
        <span className="ad-short">{ad.short || ad.subline}</span>
      ) : (
        <div className="ad-text">
          <span className="ad-headline">{ad.headline}</span>
          {ad.subline && <span className="ad-subline">{ad.subline}</span>}
        </div>
      )}
      {variant !== 'strip' && <span className="ad-badge">Ad</span>}
    </div>
  );
}
