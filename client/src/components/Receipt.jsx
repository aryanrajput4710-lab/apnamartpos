import React from 'react';
import './Receipt.css';

export default function Receipt({ order }) {
  if (!order) return null;

  // Format date and time
  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isCash = order.payments && order.payments[0]?.method === 'CASH';
  const cashAmount = isCash ? order.payments[0].amount : 0; // For now just show amount as received

  return (
    <div className="receipt-container">
      {/* Header */}
      <div className="receipt-header">
        <div className="receipt-header-left">
          <img src="/logo.png" alt="Apna Mart" className="receipt-logo" />
        </div>
        <div className="receipt-header-right">
          <h1 className="receipt-store-name">Apna Mart</h1>
          <p className="receipt-address">Gaya Bhagat Chowk,Golma</p>
          <p className="receipt-location">District - Saharsa,PIN-852107</p>
          <p className="receipt-tagline">Best Quality Low Price</p>
        </div>
      </div>

      <div className="receipt-separator" />

      {/* Order Information */}
      <div className="receipt-info">
        <div className="receipt-info-row">
          <span className="receipt-info-label">Order No</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{order.id.split('-')[0].toUpperCase()}</span>
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
        <div className="receipt-info-row">
          <span className="receipt-info-label">Cashier</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{order.user?.name || 'Cashier'}</span>
        </div>
        <div className="receipt-info-row">
          <span className="receipt-info-label">Customer</span>
          <span className="receipt-info-colon">:</span>
          <span className="receipt-info-value">{order.customer?.name || 'Walk-in Customer'}</span>
        </div>
        {order.customer?.phone && (
          <div className="receipt-info-row">
            <span className="receipt-info-label">Phone</span>
            <span className="receipt-info-colon">:</span>
            <span className="receipt-info-value">{order.customer.phone}</span>
          </div>
        )}
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
              <span className="col-price">₹{parseFloat(item.unitPrice).toFixed(0)}</span>
              <span className="col-disc">₹{parseFloat(item.discount).toFixed(0)}</span>
              <span className="col-sub">₹{parseFloat(item.total).toFixed(0)}</span>
            </div>
            <div className="receipt-item-details">
              {item.sizeSnapshot && `Size: ${item.sizeSnapshot}`}
              {item.sizeSnapshot && item.colorSnapshot && ' | '}
              {item.colorSnapshot && `Color: ${item.colorSnapshot}`}
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
          <span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
        </div>
        <div className="receipt-total-row">
          <span>Discount</span>
          <span>₹{parseFloat(order.discount).toFixed(2)}</span>
        </div>
        <div className="receipt-total-row">
          <span>Tax</span>
          <span>₹0.00</span>
        </div>
        <div className="receipt-total-row receipt-final-total">
          <span>TOTAL</span>
          <span>₹{parseFloat(order.total).toFixed(2)}</span>
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
              <span className="receipt-info-value">₹{parseFloat(cashAmount).toFixed(2)}</span>
            </div>
            <div className="receipt-pay-row">
              <span className="receipt-info-label">Change Returned</span>
              <span className="receipt-info-colon">:</span>
              <span className="receipt-info-value">₹0.00</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-separator" />

      {/* Footer */}
      <div className="receipt-footer">
        <h3>Thank You</h3>
        <p>Please Visit Us Again</p>
      </div>
    </div>
  );
}
