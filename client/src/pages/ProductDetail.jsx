import { useState, useEffect, useRef } from 'react';
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
  return (
    <div className="product-detail-container">
      <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2>{product.name}</h2>
          <p>Category: {product.category}</p>
        </div>
        <button onClick={handlePrint} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Print Labels
        </button>
      </div>
      <div className="print-area">
        {product.variants.map((variant) => (
          <div className="label-container" key={variant.id}>
            <div className="label-top-section">
              <div className="label-qr-wrapper">
                <QRCodeSVG value={variant.barcode} size={110} level="H" />
              </div>
              <div className="label-info-wrapper">
                <div className="label-product-name">{product.name}</div>
                <div className="label-info-line">Brand: {product.brand || ' '}</div>
                  <div className="label-info-line">Size: {variant.size || ' '}</div>
                <div className="label-info-line">Color: {variant.color || ' '}</div>
                {/* Ingredient is COMPLETELY REMOVED per specs */}
              </div>
            </div>
            
            <div className="label-divider"></div>
            
            <div className="label-price-section">
                <div className="label-mrp-text" style={{ textDecoration: 'line-through', fontSize: '0.95rem', letterSpacing: '4px', fontSize: '1.05rem', color: '#333', marginBottom: '2px' }}>MRP: Rs. {variant.mrp}</div>
                <div className="label-price-text" style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Discount Price: Rs. {variant.sellingPrice}</div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}





