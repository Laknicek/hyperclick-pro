import React, { useState, useEffect, useCallback } from 'react';
import { WaypointOverlay } from './WaypointOverlay';
import { ClickWaypoint, EngineStatus } from '../types/electron';

export const WaypointOverlayWindow: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeWaypointIndex, setActiveWaypointIndex] = useState<number | null>(null);

  const getElectronAPI = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.electronAPI) return window.electronAPI;
      if (window.electron) return window.electron;
    }
    return null;
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('transparent-window');
    document.body.classList.add('transparent-window');

    const electron = getElectronAPI();
    if (electron) {
      const unsub = electron.onStatusUpdate((status: EngineStatus) => {
        setIsRunning(status.isRunning);
        if (typeof status.currentWaypointIndex === 'number') {
          setActiveWaypointIndex(status.currentWaypointIndex);
        }
      });

      return () => unsub();
    }
  }, [getElectronAPI]);

  const handleClose = () => {
    const electron = getElectronAPI();
    if (electron?.toggleOverlay) {
      electron.toggleOverlay(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent select-none">
      <WaypointOverlay
        isRunning={isRunning}
        activeWaypointIndex={activeWaypointIndex}
        onClose={handleClose}
      />
    </div>
  );
};

export default WaypointOverlayWindow;
