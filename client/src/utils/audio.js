export const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    // Create context on the fly (most modern browsers handle this fine if preceded by user interaction)
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz - classic POS beep
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime); // Volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio beep failed", e);
  }
};
