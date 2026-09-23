import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [hasCameras, setHasCameras] = useState(true);
  const [facingMode, setFacingMode] = useState("environment");
  const scannerRef = useRef(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    let html5QrCode;
    
    const startScanner = async () => {
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
        }

        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: facingMode },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scanningRef.current) return;
            scanningRef.current = true;
            
            html5QrCode.stop().then(() => {
              onScan(decodedText);
            }).catch(console.error);
          },
          () => {} // ignore frame errors
        );
        setErrorMsg("");
      } catch (err) {
        console.error("Camera error:", err);
        if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
          setErrorMsg("Camera permission is required to scan products. Please allow camera access in your browser settings.");
        } else {
          // Fallback if the specific facingMode fails
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              await html5QrCode.start(
                devices[0].id,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                  if (scanningRef.current) return;
                  scanningRef.current = true;
                  html5QrCode.stop().then(() => {
                    onScan(decodedText);
                  }).catch(console.error);
                },
                () => {}
              );
              setErrorMsg("");
            } else {
              setHasCameras(false);
              setErrorMsg("No cameras found on this device.");
            }
          } catch (fallbackErr) {
            setHasCameras(false);
            setErrorMsg("Unable to access the camera. Ensure you are using HTTPS and have granted permissions.");
          }
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Scan Product Code</h3>
          <button 
            onClick={() => {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(onClose).catch(onClose);
              } else {
                onClose();
              }
            }} 
            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ?
          </button>
        </div>

        {errorMsg ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <p style={{ margin: 0 }}>{errorMsg}</p>
          </div>
        ) : (
          <div id="qr-reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Point your camera at the product barcode.
          </div>
          {hasCameras && (
            <button 
              onClick={toggleCamera}
              style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}
            >
              Flip Camera
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
}
