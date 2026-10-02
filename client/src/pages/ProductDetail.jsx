import { SkeletonCard } from '../components/SkeletonRow';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import './LabelPrint.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labelCounts, setLabelCounts] = useState({});
  const [showSellingPrice, setShowSellingPrice] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.data);
      
      const counts = {};
      res.data.data.variants.forEach(v => counts[v.id] = 1);
      setLabelCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCount = (variantId, count) => {
    setLabelCounts(prev => ({
      ...prev,
      [variantId]: Math.max(0, parseInt(count) || 0)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  if (!product) return <div>Product not found</div>;

  const totalLabels = Object.values(labelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="product-detail-container">
      {/* NO PRINT CONFIGURATION AREA */}
      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{product.name}</h2>
            <p style={{ margin: 0, color: '#64748b' }}>
              Category: {product.category}{product.subcategory ? ` > ${product.subcategory}` : ''}
            </p>
          </div>
          <button onClick={handlePrint} disabled={totalLabels === 0} style={{ padding: '0.75rem 1.5rem', background: totalLabels > 0 ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', cursor: totalLabels > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
            Print {totalLabels} Labels
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
            <input 
              type="checkbox" 
              checked={showSellingPrice} 
              onChange={(e) => setShowSellingPrice(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            Show Selling Price on Label
          </label>
        </div>

        <div>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Select Print Quantities</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {product.variants.map((variant) => (
              <div key={variant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                    {variant.size || variant.color ? `${variant.size || ''} ${variant.color || ''}`.trim() : 'Standard Variant'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                    MRP: Rs. {variant.mrp} | Stock: {variant.stock} | SKU: {variant.sku || 'N/A'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Copies:</label>
                  <input 
                    type="number" 
                    min="0"
                    value={labelCounts[variant.id] ?? 0}
                    onChange={(e) => updateCount(variant.id, e.target.value)}
                    style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* ACTUAL PRINT AREA (HIDDEN ON SCREEN BY CSS IF NEEDED, BUT WE SHOW IT AS PREVIEW) */}
      <div>
        <h3 className="no-print" style={{ color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Print Preview</h3>
        <div className="print-area">
          {product.variants.map((variant) => {
            const count = labelCounts[variant.id] || 0;
            if (count === 0) return null;

            const brand = product.brand?.trim();
            const size = variant.size?.trim();
            const color = variant.color?.trim();
            const netQty = variant.netQuantity?.trim();
            
            const hasDiscount = variant.sellingPrice && variant.mrp && parseFloat(variant.sellingPrice) < parseFloat(variant.mrp);

            // Generate an array of size `count`
            return Array.from({ length: count }).map((_, index) => (
              <div className="label-container" key={`${variant.id}-${index}`}>
                <div className="label-content">
                  <div className="label-text-section">
                    <div className="label-title">{product.name}</div>
                    
                    {(brand || size || color || netQty) && (
                      <div className="label-details">
                        {brand && <span className="label-detail-item">Brand: {brand}</span>}
                        {size && <span className="label-detail-item">Size: {size}</span>}
                        {color && <span className="label-detail-item">Color: {color}</span>}
                        {netQty && <span className="label-detail-item">Net Qty: {netQty}</span>}
                      </div>
                    )}
                    
                    <div className="label-pricing">
                      {showSellingPrice && hasDiscount ? (
                        <>
                          <div className="label-mrp">MRP: Rs. {variant.mrp}</div>
                          <div className="label-sale">
                            <div>SALE:</div>
                            <div>Rs. {variant.sellingPrice}</div>
                          </div>
                        </>
                      ) : (
                        <div className="label-sale" style={!showSellingPrice ? { fontSize: '1.1rem', justifyContent: 'center', fontWeight: 'bold' } : {}}>
                          <div>MRP:</div>
                          <div>Rs. {variant.mrp || variant.sellingPrice}</div>
                        </div>
                      )}
                    </div>
                    
                    {variant.remarks && (
                      <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginTop: '2px', paddingTop: '2px', borderTop: '1px dashed #cbd5e1', lineHeight: '1.1' }}>
                        {variant.remarks}
                      </div>
                    )}
                  </div>

                  <div className="label-qr-section">
                    {(() => {
                      const barcodeValue = variant.barcode || variant.sku || '000000';
                      return (
                        <>
                          <QRCodeSVG 
                            value={barcodeValue} 
                            size={45} 
                            level={"M"}
                            marginSize={0}
                            style={{ shapeRendering: 'crispEdges' }}
                          />
                          <div className="label-qr-value">{barcodeValue}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
}
