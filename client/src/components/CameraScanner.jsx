import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Prevent multiple initializations in React strict mode
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanning after first successful scan
        scanner.clear().catch(console.error);
        onScan(decodedText);
      },
      (error) => {
        // Ignore normal scan errors (happens every frame it doesn't see a code)
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Scan Product Code</h3>
          <button onClick={onClose} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
        </div>
        <div id="qr-reader" style={{ width: '100%' }}></div>
      </div>
    </div>
  );
}
