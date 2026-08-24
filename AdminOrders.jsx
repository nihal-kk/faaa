import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedBoy, setSelectedBoy] = useState({});
  
  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeliveryBoys = async () => {
    try {
      const { data } = await axios.get('/api/users');
      setDeliveryBoys(data.filter(u => u.role === 'DELIVERY_BOY'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
  }, []);

  const updateStatus = async (id, status, deliveryBoyId = null) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { status, deliveryBoyId });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  return (
    <div>
      <div className="header">
        <h1 className="page-title">Manage Orders</h1>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Branch</th>
                <th>Placed By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Delivery Boy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td data-label="Order ID">{o.orderNumber}</td>
                  <td data-label="Branch">{o.branch?.name}</td>
                  <td data-label="Placed By">{o.placedBy?.name}</td>
                  <td data-label="Date">{new Date(o.createdAt).toLocaleString()}</td>
                  <td data-label="Status"><span className="badge badge-primary">{o.status}</span></td>
                  <td data-label="Delivery Boy">{o.deliveryBoy ? o.deliveryBoy.name : 'Unassigned'}</td>
                  <td data-label="Actions">
                    {o.status === 'PLACED' && (
                      <button className="btn btn-primary" onClick={() => updateStatus(o._id, 'CONFIRMED')}>Confirm</button>
                    )}
                    {o.status === 'CONFIRMED' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <select 
                          className="form-control" 
                          style={{ padding: '0.25rem', width: 'auto' }}
                          value={selectedBoy[o._id] || ''} 
                          onChange={(e) => setSelectedBoy({...selectedBoy, [o._id]: e.target.value})}
                        >
                          <option value="">Select Boy</option>
                          {deliveryBoys.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => {
                            if (!selectedBoy[o._id]) return alert('Please select a delivery boy first');
                            updateStatus(o._id, 'ASSIGNED_TO_DELIVERY', selectedBoy[o._id]);
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
