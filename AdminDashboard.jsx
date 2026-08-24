import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ branches: 0, products: 0 });
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const branchRes = await axios.get('/api/branches');
        const prodRes = await axios.get('/api/products');
        const orderRes = await axios.get('/api/orders');
        setStats({ branches: branchRes.data.length, products: prodRes.data.length });
        setOrders(orderRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const today = new Date();
  const todaysOrders = orders.filter(o => {
    const d = new Date(o.createdAt || o.updatedAt || Date.now());
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  });

  const getCount = (status) => todaysOrders.filter(o => o.status === status).length;
  
  const placedCount = getCount('PLACED');
  const confirmedCount = getCount('CONFIRMED');
  const outCount = getCount('ASSIGNED_TO_DELIVERY') + getCount('PICKED_UP') + getCount('OUT_FOR_DELIVERY');
  const completedCount = getCount('DELIVERED') + getCount('RECEIVED') + getCount('COMPLETED');
  
  const activeDeliveries = outCount;
  const todayOrders = todaysOrders.length; 
  
  const pendingValue = todaysOrders
    .filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status))
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p className="text-sm font-bold uppercase" style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>
            TUESDAY • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', letterSpacing: '-0.02em' }}>Good morning, operator.</h1>
          <p className="text-muted">The kitchen is moving. Here's the line as it stands right now.</p>
        </div>
        <div>
          <button className="btn btn-outline" style={{ backgroundColor: 'var(--white)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.66-2.07"/></svg>
            Refresh feed
          </button>
        </div>
      </div>
      
      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="text-xs font-bold text-muted uppercase">Orders Today</p>
            <div style={{ backgroundColor: '#FDF3DF', padding: '6px', borderRadius: '6px', color: 'var(--primary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>{todayOrders}</p>
            <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>{placedCount} need attention</p>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="text-xs font-bold text-muted uppercase">Active Deliveries</p>
            <div style={{ backgroundColor: 'var(--gray-light)', padding: '6px', borderRadius: '6px', color: 'var(--gray-dark)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>{activeDeliveries}</p>
            <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Across the network</p>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="text-xs font-bold text-muted uppercase">Branches Live</p>
            <div style={{ backgroundColor: 'var(--gray-light)', padding: '6px', borderRadius: '6px', color: 'var(--gray-dark)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>{stats.branches}</p>
            <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>All regions reporting</p>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p className="text-xs font-bold text-muted uppercase">Low Stock</p>
            <div style={{ backgroundColor: '#FDF3DF', padding: '6px', borderRadius: '6px', color: '#B47A11' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>1</p>
            <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>Items below threshold</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* Order Pulse */}
        <div className="card">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>Order Pulse</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Today's movement</h2>
              <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>Current order status across all branches</p>
            </div>
            <a href="#" className="text-sm font-bold" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              View queue <span style={{ fontSize: '1.2em' }}>→</span>
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, minWidth: '140px', backgroundColor: '#F8F5EE', padding: '1rem', borderRadius: '8px' }}>
              <span className="badge status-placed">Placed</span>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>{placedCount}</p>
            </div>
            <div style={{ flex: 1, minWidth: '140px', backgroundColor: '#F8F5EE', padding: '1rem', borderRadius: '8px' }}>
              <span className="badge status-confirmed">Confirmed</span>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>{confirmedCount}</p>
            </div>
            <div style={{ flex: 1, minWidth: '140px', backgroundColor: '#F8F5EE', padding: '1rem', borderRadius: '8px' }}>
              <span className="badge status-out">Out for Delivery</span>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>{outCount}</p>
            </div>
            <div style={{ flex: 1, minWidth: '140px', backgroundColor: '#F8F5EE', padding: '1rem', borderRadius: '8px' }}>
              <span className="badge status-completed">Completed</span>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>{completedCount}</p>
            </div>
          </div>

          <div style={{ width: '100%', height: '8px', backgroundColor: '#F8F5EE', borderRadius: '4px', overflow: 'hidden' }}>
             <div style={{ width: `${(completedCount / (todayOrders || 1)) * 100}%`, height: '100%', backgroundColor: 'var(--primary)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
             <span className="text-xs text-muted">Completed</span>
             <span className="text-xs text-muted">In the line</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
           <p className="text-xs font-bold uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Live Feed</p>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Recent activity</h2>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-dark)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             {[...orders]
               .sort((a, b) => new Date(b.updatedAt || b.createdAt || Date.now()) - new Date(a.updatedAt || a.createdAt || Date.now()))
               .slice(0, 5)
               .map((o, idx) => {
                 const formatTime = (dateString) => {
                   if (!dateString) return 'Just now';
                   const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
                   if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)} sec ago`;
                   const diffInMinutes = Math.floor(diffInSeconds / 60);
                   if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
                   const diffInHours = Math.floor(diffInMinutes / 60);
                   if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                   const diffInDays = Math.floor(diffInHours / 24);
                   if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                   const diffInMonths = Math.floor(diffInDays / 30);
                   return diffInMonths < 12 ? `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago` : `A long time ago`;
                 };
                 return (
                 <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }}></div>
                   <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <p className="font-bold text-sm">Order {o.orderNumber} {o.status.toLowerCase().replace(/_/g, ' ')}</p>
                       <span className="text-xs text-muted">{formatTime(o.updatedAt || o.createdAt)}</span>
                     </div>
                     <p className="text-xs text-muted" style={{ marginTop: '2px' }}>{o.branch?.name || 'Unknown Branch'} • {o.items?.length || 0} line items</p>
                   </div>
                 </div>
               )})}
             {orders.length === 0 && <p className="text-sm text-muted">No recent activity.</p>}
           </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="dashboard-bottom-grid">
        <div className="card" style={{ flex: 2, backgroundColor: 'var(--primary)', color: 'var(--white)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <p className="text-xs font-bold uppercase" style={{ letterSpacing: '0.05em' }}>Kitchen value in play</p>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
           </div>
           <h2 style={{ fontSize: '3rem', fontWeight: '800', marginTop: '0.5rem', lineHeight: '1' }}>₹{pendingValue.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ flex: 1 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
             <p className="text-xs font-bold uppercase text-muted" style={{ letterSpacing: '0.05em' }}>Control Note</p>
           </div>
           <p className="font-bold">Keep the line moving, one clear handoff at a time.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
