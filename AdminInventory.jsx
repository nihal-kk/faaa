import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, Plus, Minus, Edit2, X, Check, Search } from 'lucide-react';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustModal, setAdjustModal] = useState({ isOpen: false, item: null, type: 'add', amount: '' });
  
  const fetchInventory = async () => {
    try {
      const { data } = await axios.get('/api/inventory');
      setInventory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const submitAdjustment = async () => {
    const amount = parseFloat(adjustModal.amount);
    if (isNaN(amount) || amount === '') return;

    let quantityChange = 0;
    if (adjustModal.type === 'add') {
      quantityChange = amount;
    } else if (adjustModal.type === 'remove') {
      quantityChange = -amount;
    } else if (adjustModal.type === 'set') {
      quantityChange = amount - adjustModal.item.currentStock;
    }

    if (quantityChange === 0) {
      setAdjustModal({ ...adjustModal, isOpen: false });
      return;
    }

    try {
      await axios.post('/api/inventory/adjust', {
        productId: adjustModal.item.product._id,
        quantityChange,
        reason: `Admin Adjustment (${adjustModal.type})`
      });
      fetchInventory();
      setAdjustModal({ isOpen: false, item: null, type: 'add', amount: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting inventory');
    }
  };

  const handleDeleteClick = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        fetchInventory(); // Refresh list after deletion
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  const filteredInventory = inventory.filter(inv => 
    inv.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* ADJUSTMENT MODAL */}
      {adjustModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--white)', padding: '2rem', borderRadius: '16px',
            width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            <button onClick={() => setAdjustModal({ ...adjustModal, isOpen: false })} style={{
              position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--gray-dark)'
            }}><X size={24} /></button>
            
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--black)' }}>
              <Package size={24} color="var(--primary)" />
              Adjust Stock
            </h2>
            
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{adjustModal.item.product.name}</div>
              <div style={{ color: 'var(--gray-dark)', fontSize: '0.9rem' }}>
                Current Stock: <span style={{ fontWeight: 'bold', color: 'var(--black)' }}>{adjustModal.item.currentStock} {adjustModal.item.product.unit}</span>
              </div>
            </div>

            {/* ACTION TABS */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--gray-light)', padding: '0.25rem', borderRadius: '10px' }}>
              <button 
                onClick={() => setAdjustModal({ ...adjustModal, type: 'add' })}
                style={{ 
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: adjustModal.type === 'add' ? 'var(--white)' : 'transparent',
                  boxShadow: adjustModal.type === 'add' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                  fontWeight: adjustModal.type === 'add' ? 'bold' : 'normal',
                  color: adjustModal.type === 'add' ? 'var(--success)' : 'var(--gray-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', transition: 'all 0.2s'
                }}><Plus size={16} /> Add</button>
              <button 
                onClick={() => setAdjustModal({ ...adjustModal, type: 'remove' })}
                style={{ 
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: adjustModal.type === 'remove' ? 'var(--white)' : 'transparent',
                  boxShadow: adjustModal.type === 'remove' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                  fontWeight: adjustModal.type === 'remove' ? 'bold' : 'normal',
                  color: adjustModal.type === 'remove' ? 'var(--danger)' : 'var(--gray-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', transition: 'all 0.2s'
                }}><Minus size={16} /> Remove</button>
              <button 
                onClick={() => setAdjustModal({ ...adjustModal, type: 'set' })}
                style={{ 
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: adjustModal.type === 'set' ? 'var(--white)' : 'transparent',
                  boxShadow: adjustModal.type === 'set' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                  fontWeight: adjustModal.type === 'set' ? 'bold' : 'normal',
                  color: adjustModal.type === 'set' ? 'var(--primary)' : 'var(--gray-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', transition: 'all 0.2s'
                }}><Edit2 size={16} /> Set</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--gray-dark)' }}>
                {adjustModal.type === 'add' ? 'Amount to Add' : adjustModal.type === 'remove' ? 'Amount to Remove' : 'New Total Amount'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Enter amount..."
                  value={adjustModal.amount}
                  onChange={(e) => setAdjustModal({ ...adjustModal, amount: e.target.value })}
                  style={{ width: '100%', paddingRight: '40px', fontSize: '1.1rem' }}
                  autoFocus
                />
                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-dark)' }}>
                  {adjustModal.item.product.unit}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-primary w-full" 
              style={{ padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={submitAdjustment}
              disabled={!adjustModal.amount}
            >
              <Check size={20} /> Confirm Adjustment
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package size={32} color="var(--primary)" />
            Central Kitchen Inventory
          </h1>
          <p style={{ color: 'var(--gray-dark)', margin: '0.5rem 0 0 0' }}>Manage stock levels and adjustments</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <div style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray-dark)'
          }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search products or categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 48px', 
              borderRadius: '30px', 
              border: '1px solid var(--gray)', 
              backgroundColor: 'var(--white)',
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 4px 12px rgba(225, 73, 38, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--gray)';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            }}
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ backgroundColor: 'rgba(225, 73, 38, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '12px' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--gray-dark)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Products</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--black)', lineHeight: 1 }}>{inventory.length}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--gray-dark)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--black)', lineHeight: 1 }}>
              {inventory.filter(inv => inv.currentStock <= inv.product.minStock).length}
            </div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '12px' }}>
            <Check size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--gray-dark)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Stock</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--black)', lineHeight: 1 }}>
              {inventory.filter(inv => inv.currentStock > inv.product.minStock).length}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--gray-dark)' }}>Product</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--gray-dark)' }}>Category</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--gray-dark)' }}>Current Stock</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-dark)' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--gray-dark)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-dark)' }}>
                    <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                    No inventory items found.
                  </td>
                </tr>
              ) : filteredInventory.map(inv => {
                const isLow = inv.currentStock <= inv.product.minStock;
                return (
                  <tr key={inv._id} style={{ borderTop: '1px solid var(--gray-light)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem' }} data-label="Product">
                      <div style={{ fontWeight: 'bold' }}>{inv.product.name}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--gray-dark)' }} data-label="Category">
                      {inv.product.category}
                    </td>
                    <td style={{ padding: '1rem' }} data-label="Current Stock">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isLow ? 'var(--danger)' : 'var(--black)' }}>
                          {inv.currentStock}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--gray-dark)' }}>{inv.product.unit}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} data-label="Status">
                      {isLow ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={14} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Check size={14} /> OK
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }} data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
                          onClick={() => setAdjustModal({ isOpen: true, item: inv, type: 'add', amount: '' })}
                        >
                          <Edit2 size={16} /> Adjust
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                          onClick={() => handleDeleteClick(inv.product._id)}
                        >
                          <X size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;

