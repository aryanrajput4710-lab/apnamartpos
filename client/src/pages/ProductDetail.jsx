import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import './LabelPrint.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  const getOptionalInfo = (variant) => {
    const size = variant.size?.trim();
    const color = variant.color?.trim();
    const netQty = variant.netQuantity?.trim();

    const parts = [];
    if (size) parts.push(`Size: ${size}`);
    if (color) parts.push(`Color: ${color}`);
    
    if (parts.length > 0) {
      return parts.join(' • ');
    }
    if (netQty) {
      return `Net Qty: ${netQty}`;
    }
    return null;
  };

  return (
    <div className="product-detail-container">
      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>{product.name}</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Category: {product.category}{product.subcategory ? ` > ${product.subcategory}` : ''}
          </p>
        </div>
        <button onClick={handlePrint} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Print Labels
        </button>
      </div>
      
      <div className="print-area">
        {product.variants.map((variant) => {
          const brand = product.brand?.trim();
          const optInfo = getOptionalInfo(variant);
          // Standard retail logic: if selling price is less than MRP, show both, otherwise just show MRP or both as equal.
          const hasDiscount = variant.sellingPrice && variant.mrp && parseFloat(variant.sellingPrice) < parseFloat(variant.mrp);

          return (
            <div className="label-container" key={variant.id}>
              <div className="label-content">
                
                {/* 1. Header Section */}
                <div className="label-header">
                  <div className="label-title">{product.name}</div>
                  {brand && <div className="label-brand">{brand}</div>}
                  {optInfo && <div className="label-optional">{optInfo}</div>}
                </div>
                
                <div className="label-divider"></div>
                
                {/* 2. Pricing Section */}
                <div className="label-pricing">
                  {hasDiscount ? (
                    <>
                      <div className="label-mrp">MRP: ₹{variant.mrp}</div>
                      <div className="label-sale">SALE: ₹{variant.sellingPrice}</div>
                    </>
                  ) : (
                    <div className="label-sale">MRP: ₹{variant.mrp}</div>
                  )}
                </div>

                {/* 3. Barcode Section */}
                <div className="label-barcode-section">
                  <QRCodeSVG value={variant.barcode || variant.sku} size={64} level="M" />
                  <div className="label-barcode-number">{variant.barcode || variant.sku}</div>
                </div>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}





