export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '1rem 1.25rem' }}>
          <div style={{ height: '14px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', borderRadius: '6px', animation: 'shimmer 1.5s infinite', width: i === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ height: '16px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', borderRadius: '6px', animation: 'shimmer 1.5s infinite', width: '60%', marginBottom: '0.5rem' }} />
      <div style={{ height: '12px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', borderRadius: '6px', animation: 'shimmer 1.5s infinite', width: '40%' }} />
    </div>
  );
}
