import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminSalesHistory = () => {
  const [sales, setSales] = useState([]);
  
  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders');
      // Filter for completed sales
      const completedSales = data.filter(o => o.status === 'COMPLETED' || o.status === 'RECEIVED' || o.status === 'DELIVERED');
      // Sort by latest first
      completedSales.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      setSales(completedSales);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Calculate metrics
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const dailyTotal = sales.filter(s => new Date(s.updatedAt || s.createdAt) >= startOfDay).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const weeklyTotal = sales.filter(s => new Date(s.updatedAt || s.createdAt) >= startOfWeek).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const monthlyTotal = sales.filter(s => new Date(s.updatedAt || s.createdAt) >= startOfMonth).reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  return (
    <div>
      <div className="header">
        <h1 className="page-title">Sales History</h1>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">Today's Revenue</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem', color: 'var(--success)' }}>₹{dailyTotal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">This Week</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem', color: 'var(--primary)' }}>₹{weeklyTotal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">This Month</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem' }}>₹{monthlyTotal.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="card">
        <h3>Completed Orders</h3>
        <div className="table-container mt-2">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Branch</th>
                <th>Completion Date</th>
                <th>Status</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No sales recorded yet.</td>
                </tr>
              ) : sales.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 'bold' }} data-label="Order ID">{s.orderNumber}</td>
                  <td data-label="Branch">{s.branch?.name || 'Unknown'}</td>
                  <td data-label="Completion Date">{new Date(s.updatedAt || s.createdAt).toLocaleString('en-GB')}</td>
                  <td data-label="Status">
                    <span className="badge" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }} data-label="Total Amount">₹{(s.totalAmount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesHistory;
