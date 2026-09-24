import { useEffect, useRef } from 'react';

/**
 * A hook to globally listen for hardware barcode scanners.
 * Hardware scanners act as rapid keyboards that type the code and hit Enter.
 */
export function useBarcodeScanner(onScan) {
  const buffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is intentionally typing in an input field (other than the main search bar)
      // Actually, we want it to work even if focused on the main search bar to prevent duplicate entries, 
      // but let's just let it capture everything globally.
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // Most hardware scanners type a character every 10-30ms.
      // If someone takes more than 100ms between keystrokes, they are manually typing.
      if (timeDiff > 100) {
        buffer.current = '';
      }

      if (e.key === 'Enter') {
        if (buffer.current.length >= 3) {
          // Valid barcode scanned
          onScan(buffer.current);
          buffer.current = '';
          e.preventDefault(); // Prevent form submission if focused on a random button
        }
      } else if (e.key.length === 1) { // Only capture printable characters
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
