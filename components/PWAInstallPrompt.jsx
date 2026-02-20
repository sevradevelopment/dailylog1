import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
      setShowManual(false);
    } else {
      // Show manual instructions after 3 seconds if no prompt
      setTimeout(() => {
        if (!showInstall) {
          setShowManual(true);
        }
      }, 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const dismiss = () => {
    setShowInstall(false);
    setShowManual(false);
  };

  if (!showInstall && !showManual) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Install DailyLog</h3>
          {showInstall ? (
            <p className="text-sm opacity-90">Install app telefoni jaoks</p>
          ) : (
            <div className="text-sm opacity-90">
              <p>Käsitsi installimiseks:</p>
              <p>• Android: ⋮ &gt; Lisa avalehele</p>
              <p>• iPhone: □↑ &gt; Lisa avalehele</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {showInstall && (
            <button
              onClick={handleInstall}
              className="px-3 py-1 text-sm bg-white text-blue-600 hover:bg-gray-100 rounded font-semibold"
            >
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="px-3 py-1 text-sm bg-blue-700 hover:bg-blue-800 rounded"
          >
            {showInstall ? 'Hiljem' : 'Sulge'}
          </button>
        </div>
      </div>
    </div>
  );
}