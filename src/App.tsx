import { useState, useEffect } from 'react';
import Setup from './Setup';
import Widget from './Widget';
import type { AppConfig } from './types';
import { startUsageTracking } from './usage';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(true);

  useEffect(() => {
    startUsageTracking();

    // Load config from local storage on mount
    const savedConfigStr = localStorage.getItem('scoredeck-config');
    if (savedConfigStr) {
      try {
        const savedConfig = JSON.parse(savedConfigStr);
        setConfig(savedConfig);
        setIsSetupMode(false); // If we have config, go straight to widget
        
        // Notify electron to shrink
        if (window.electronAPI) {
           window.electronAPI.resizeToWidget(savedConfig);
           window.electronAPI.setStartup(savedConfig.startupOnBoot);
        }
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    } else {
      if (window.electronAPI) {
         window.electronAPI.resizeToSetup();
      }
    }

    if (window.electronAPI && window.electronAPI.onOpenSetup) {
      window.electronAPI.onOpenSetup(() => {
        setIsSetupMode(true);
      });
    }
  }, []);

  const handleSetupComplete = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('scoredeck-config', JSON.stringify(newConfig));
    setIsSetupMode(false);
    
    if (window.electronAPI) {
      window.electronAPI.resizeToWidget(newConfig);
      window.electronAPI.setStartup(newConfig.startupOnBoot);
    }
  };

  const handleOpenSetup = () => {
    setIsSetupMode(true);
    if (window.electronAPI) {
      window.electronAPI.resizeToSetup();
    }
  };

  if (isSetupMode) {
    return <Setup onComplete={handleSetupComplete} initialConfig={config} />;
  }

  if (!config) return null;

  return <Widget config={config} onOpenSetup={handleOpenSetup} />;
}

export default App;
