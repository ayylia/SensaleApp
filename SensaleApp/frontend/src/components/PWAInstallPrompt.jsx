import { useState, useEffect } from 'react';

/**
 * PWAInstallPrompt — shows a sleek install banner when the browser
 * fires the `beforeinstallprompt` event (Chrome/Edge/Android).
 * Dismissed state is persisted in localStorage.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or running as standalone PWA
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (dismissed || isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <div style={styles.iconWrap}>
          <img src="/icon-192x192.png" alt="Sensale" style={styles.icon} />
        </div>
        <div style={styles.textWrap}>
          <p style={styles.title}>Install Sensale</p>
          <p style={styles.subtitle}>Add to your home screen for the best experience</p>
        </div>
        <div style={styles.actions}>
          <button onClick={handleInstall} style={styles.installBtn}>
            Install
          </button>
          <button onClick={handleDismiss} style={styles.dismissBtn}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    width: 'calc(100% - 2rem)',
    maxWidth: '480px',
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(124,58,237,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(124,58,237,0.4), 0 2px 8px rgba(0,0,0,0.3)',
    border: '1px solid rgba(167,139,250,0.3)',
    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  iconWrap: {
    flexShrink: 0,
  },
  icon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.01em',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.7)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  installBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'background 0.2s',
  },
  dismissBtn: {
    padding: '0.4rem 0.6rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
};
