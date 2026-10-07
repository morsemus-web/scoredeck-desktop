export {};

declare global {
  const __APP_VERSION__: string;

  interface Window {
    electronAPI: {
      resizeToSetup: () => void;
      resizeToWidget: (config: any) => void;
      resizeToExpanded: () => void;
      setStartup: (enabled: boolean) => void;
      getDisplays: () => Promise<any[]>;
      onOpenSetup: (callback: () => void) => void;
      openExternal: (url: string) => void;
    };
  }
}
