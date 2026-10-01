import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import api from '../services/api';
import './Receipt.css';

// Format amount: remove .00 for whole numbers, keep decimals otherwise
function fmt(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function Receipt({ order }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data)).catch(console.error);
  }, []);

  if (!order) return null;

  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const payment = order.payments?.[0];
  const payMethod = payment?.method || 'CASH';
  const payStatus = payment?.status === 'COMPLETED' ? 'PAID' : 'PENDING';
  const isCash = payMethod === 'CASH';
  const cashAmount = isCash ? parseFloat(payment?.amount || 0) : 0;
  const changeReturned = Math.max(0, cashAmount - parseFloat(order.total || 0));

  const billNo = order.orderNumber || order.id?.split('-')[0].toUpperCase() || 'N/A';

  // Check if any item has a non-zero discount
  const hasDiscount = order.items?.some(item => parseFloat(item.discount || 0) > 0);
  const orderDiscount = parseFloat(order.discount || 0);
  const orderSubtotal = parseFloat(order.subtotal || 0);
  const orderTotal = parseFloat(order.total || 0);

  const storeName = settings?.storeName || 'APNA MART';
  const storeAddress = settings?.storeAddress || 'Gaya Bhagat Chowk, Golma, District - Saharsa, PIN-852107';
  const storePhone = settings?.storePhone || '';
  const footerText = settings?.receiptFooter || 'Best Quality · Low Price';

  return (
    <div className="receipt-container">

      {/* ── HEADER ── */}
      <div className="receipt-header">
        <div className="receipt-store-name">{storeName}</div>
        <div className="receipt-address">{storeAddress}</div>
        {storePhone && <div className="receipt-address">Ph: {storePhone}</div>}
        <div className="receipt-tagline">{footerText}</div>
      </div>

      <div className="receipt-sep-dash" />

      {/* ── BILL INFO ── */}
      <div className="receipt-info">
        <div className="receipt-info-row">
          <span className="rif-label">Bill No</span>
          <span className="rif-colon">:</span>
          <span className="rif-value">{billNo}</span>
        </div>
        <div className="receipt-info-row">
          <span className="rif-label">Date</span>
          <span className="rif-colon">:</span>
          <span className="rif-value">{dateStr}</span>
        </div>
        <div className="receipt-info-row">
          <span className="rif-label">Time</span>
          <span className="rif-colon">:</span>
          <span className="rif-value">{timeStr}</span>
        </div>
        {order.customer?.name && (
          <div className="receipt-info-row">
            <span className="rif-label">Customer</span>
            <span className="rif-colon">:</span>
            <span className="rif-value">{order.customer.name}</span>
          </div>
        )}
        {order.user?.name && (
          <div className="receipt-info-row">
            <span className="rif-label">Cashier</span>
            <span className="rif-colon">:</span>
            <span className="rif-value">{order.user.name}</span>
          </div>
        )}
      </div>

      <div className="receipt-sep-dash" />

      {/* ── ITEM TABLE ── */}
      <div className="receipt-items">
        {/* Header row */}
        <div className="item-hdr">
          <span className="ic-name">ITEM</span>
          <span className="ic-qty">QTY</span>
          <span className="ic-rate">RATE</span>
          <span className="ic-amt">AMT</span>
        </div>
        <div className="receipt-sep-solid" />

        {order.items?.map((item, idx) => {
          const disc = parseFloat(item.discount || 0);
          const unitPrice = parseFloat(item.unitPrice || 0);
          const itemTotal = parseFloat(item.total || 0);
          const details = [
            item.sizeSnapshot?.trim() ? `Size: ${item.sizeSnapshot.trim()}` : '',
            item.colorSnapshot?.trim() ? `Color: ${item.colorSnapshot.trim()}` : '',
            item.netQuantitySnapshot?.trim() ? `Qty: ${item.netQuantitySnapshot.trim()}` : '',
          ].filter(Boolean).join('  ·  ');

          return (
            <div key={idx} className="item-row">
              <div className="item-row-main">
                <span className="ic-name ic-name-wrap">
                  {idx + 1}. {item.productNameSnapshot}
                </span>
                <span className="ic-qty">{item.quantity}</span>
                <span className="ic-rate">₹{fmt(unitPrice)}</span>
                <span className="ic-amt">₹{fmt(itemTotal)}</span>
              </div>
              {details && (
                <div className="item-details">{details}</div>
              )}
              {hasDiscount && disc > 0 && (
                <div className="item-disc-row">
                  <span className="item-disc-label">Disc</span>
                  <span className="item-disc-val">- ₹{fmt(disc)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="receipt-sep-dash" />

      {/* ── TOTALS ── */}
      <div className="receipt-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>₹{fmt(orderSubtotal)}</span>
        </div>
        {orderDiscount > 0 && (
          <div className="total-row">
            <span>Discount</span>
            <span>- ₹{fmt(orderDiscount)}</span>
          </div>
        )}
        <div className="total-row">
          <span>Tax</span>
          <span>₹0</span>
        </div>
        <div className="receipt-sep-dash" style={{ margin: '5px 0' }} />
        <div className="total-row total-final">
          <span>TOTAL</span>
          <span>₹{fmt(orderTotal)}</span>
        </div>
      </div>

      <div className="receipt-sep-dash" />

      {/* ── PAYMENT ── */}
      <div className="receipt-payment">
        <div className="pay-row">
          <span className="pay-label">PAYMENT</span>
          <span className="pay-colon">:</span>
          <span className="pay-method">{payMethod}</span>
          <span className={`pay-badge ${payStatus === 'PAID' ? 'pay-paid' : 'pay-pending'}`}>
            {payStatus}
          </span>
        </div>
        {isCash && cashAmount > 0 && (
          <>
            <div className="pay-row">
              <span className="pay-label">Cash Received</span>
              <span className="pay-colon">:</span>
              <span>₹{fmt(cashAmount)}</span>
            </div>
            <div className="pay-row">
              <span className="pay-label">Change</span>
              <span className="pay-colon">:</span>
              <span>₹{fmt(changeReturned)}</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-sep-dash" />

      {/* ── FOOTER ── */}
      <div className="receipt-footer">
        <div className="footer-thankyou">★ THANK YOU! ★</div>
        <div className="footer-sub">Please Visit Us Again</div>
        <div className="footer-terms">Terms &amp; Conditions apply for returns</div>
      </div>

      {/* ── BARCODE ── */}
      <div className="receipt-barcode">
        <Barcode
          value={billNo}
          width={1.2}
          height={36}
          fontSize={9}
          margin={0}
          displayValue={true}
          background="white"
          lineColor="#000"
        />
      </div>

    </div>
  );
}
