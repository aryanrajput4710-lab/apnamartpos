export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', confirmColor = '#dc2626', onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{title}</h3>
        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.925rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '0.55rem 1.1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '0.55rem 1.1rem', background: confirmColor, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: 'white' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
