import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Receipt.css';

export default function Receipt({ order }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data)).catch(console.error);
  }, []);

  if (!order) return null;

  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isCash = order.payments && order.payments[0]?.method === 'CASH';
  const cashAmount = isCash ? order.payments[0].amount : 0;

  return (
    <div className="receipt-container">
      {/* Header */}
      <div className="receipt-header">
        <div className="receipt-header-left">
          <img src="/receipt-logo.jpg" alt="Apna Mart" className="receipt-logo" />
        </div>
        <div className="receipt-header-right">
          <h1 className="receipt-store-name">{settings?.storeName || 'Apna Mart'}</h1>
          <p className="receipt-address">{settings?.storeAddress || 'Gaya Bhagat Chowk,Golma'}</p>
          <p className="receipt-location">District - Saharsa,PIN-852107</p>
          {settings?.storePhone && <p className="receipt-tagline">Phone: {settings.storePhone}</p>}
          <p className="receipt-tagline">Best Quality Low Price</p>
        </div>
      </div>

      <div className="receipt-separator" />

      {/* Order Information */}
      <div className="receipt-info">
        <div className="receipt-info-row">
          <span className="receipt-info-label">Order No</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{order.orderNumber || order.id.split('-')[0].toUpperCase()}</span>
        </div>
        <div className="receipt-info-row">
          <span className="receipt-info-label">Date</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{dateStr}</span>
        </div>
        <div className="receipt-info-row">
          <span className="receipt-info-label">Time</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{timeStr}</span>
        </div>
      </div>

      <div className="receipt-separator" />

      {/* Items Section */}
      <div className="receipt-items">
        <div className="receipt-item-header">
          <span className="col-item">Item</span>
          <span className="col-qty">Qty</span>
          <span className="col-price">Price</span>
          <span className="col-disc">Disc</span>
          <span className="col-sub">Sub</span>
        </div>
        
        {order.items?.map((item, idx) => (
          <div key={idx} className="receipt-item-row">
            <div className="receipt-item-main">
              <span className="col-item">{item.productNameSnapshot}</span>
              <span className="col-qty">{item.quantity}</span>
              <span className="col-price">Rs. {parseFloat(item.unitPrice).toFixed(0)}</span>
              <span className="col-disc">Rs. {parseFloat(item.discount).toFixed(0)}</span>
              <span className="col-sub">Rs. {parseFloat(item.total).toFixed(0)}</span>
            </div>
            <div className="receipt-item-details">
              {item.sizeSnapshot && Size:  + item.sizeSnapshot}
              {item.sizeSnapshot && item.colorSnapshot && ' | '}
              {item.colorSnapshot && Color:  + item.colorSnapshot}
              <br />
              SKU: {item.skuSnapshot}
              <br />
              Barcode: {item.barcodeSnapshot}
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-separator" />

      {/* Totals Section */}
      <div className="receipt-totals">
        <div className="receipt-total-row">
          <span>Subtotal</span>
          <span>Rs. {parseFloat(order.subtotal).toFixed(2)}</span>
        </div>
        <div className="receipt-total-row">
          <span>Discount</span>
          <span>Rs. {parseFloat(order.discount).toFixed(2)}</span>
        </div>
        <div className="receipt-total-row">
          <span>Tax</span>
          <span>Rs. 0.00</span>
        </div>
        <div className="receipt-total-row receipt-final-total">
          <span>TOTAL</span>
          <span>Rs. {parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="receipt-separator" />

      {/* Payment Section */}
      <div className="receipt-payment">
        <div className="receipt-pay-row">
          <span className="receipt-info-label">Payment Method</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{order.payments?.[0]?.method || 'N/A'}</span>
        </div>
        <div className="receipt-pay-row">
          <span className="receipt-info-label">Payment Status</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{order.payments?.[0]?.status === 'COMPLETED' ? 'PAID' : 'PENDING'}</span>
        </div>
        
        {isCash && (
          <>
            <div className="receipt-pay-row">
              <span className="receipt-info-label">Cash Received</span>
              <span className="receipt-info-colon">:</span>
              <span className="receipt-info-value">Rs. {parseFloat(cashAmount).toFixed(2)}</span>
            </div>
            <div className="receipt-pay-row">
              <span className="receipt-info-label">Change Returned</span>
              <span className="receipt-info-colon">:</span>
              <span className="receipt-info-value">Rs. 0.00</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-separator" />

      {/* Footer */}
      <div className="receipt-footer">
        <h3>Thank You</h3>
        <p>Please Visit Us Again</p>
        <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Cashier: {order.user?.name || 'Cashier'}</p>
        <p style={{ marginTop: '5px', fontSize: '10px' }}>Terms & Conditions apply for returns</p>
      </div>
    </div>
  );
}
