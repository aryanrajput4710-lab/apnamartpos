import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
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
          const size = variant.size?.trim();
          const color = variant.color?.trim();
          const netQty = variant.netQuantity?.trim();
          
          // Show both if discount exists. If no MRP, just show sale price.
          const hasDiscount = variant.sellingPrice && variant.mrp && parseFloat(variant.sellingPrice) < parseFloat(variant.mrp);

          return (
            <div className="label-container" key={variant.id}>
              <div className="label-content">
                
                {/* 1. Header Section */}
                <div className="label-title">{product.name}</div>
                
                {/* 2. Optional Product Details */}
                {(brand || size || color || netQty) && (
                  <div className="label-details">
                    {brand && <span className="label-detail-item">{brand}</span>}
                    {size && <span className="label-detail-item">Size: {size}</span>}
                    {color && <span className="label-detail-item">Color: {color}</span>}
                    {netQty && <span className="label-detail-item">Net Qty: {netQty}</span>}
                  </div>
                )}
                
                {/* 3. Pricing Section */}
                <div className="label-pricing">
                  {hasDiscount ? (
                    <>
                      <div className="label-mrp">MRP: Rs. {variant.mrp}</div>
                      <div className="label-sale">SALE: Rs. {variant.sellingPrice}</div>
                    </>
                  ) : (
                    <div className="label-sale">MRP: Rs. {variant.mrp || variant.sellingPrice}</div>
                  )}
                </div>

                {/* 4. Barcode Section */}
                <div className="label-barcode-section">
                  <Barcode 
                    value={variant.barcode || variant.sku || '000000'} 
                    format="CODE128" 
                    width={2} 
                    height={45} 
                    displayValue={true} 
                    fontSize={13} 
                    margin={10} 
                    background="#ffffff"
                    lineColor="#000000"
                  />
                </div>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
