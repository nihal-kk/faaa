import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    managerName: '',
    whatsAppNumber: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const formRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get('/api/branches');
      setBranches(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleEditClick = (branch) => {
    setEditingId(branch._id);
    setNewBranch({
      name: branch.name,
      address: branch.address || '',
      managerName: branch.managerName || '',
      whatsAppNumber: branch.whatsAppNumber || ''
    });
    setShowAddForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await axios.delete(`/api/branches/${id}`);
        fetchBranches();
        showNotification('Branch deleted successfully!');
      } catch (err) {
        showNotification(err.response?.data?.message || 'Error deleting branch', 'error');
      }
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.put(`/api/branches/${editingId}`, newBranch);
        showNotification('Branch updated successfully!');
      } else {
        await axios.post('/api/branches', newBranch);
        showNotification('Branch created successfully!');
      }

      setNewBranch({ name: '', address: '', managerName: '', whatsAppNumber: '' });
      setEditingId(null);
      setShowAddForm(false);
      fetchBranches();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving branch', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {notification.message && (
        <div className="toast-container toast-animate" style={{
          backgroundColor: notification.type === 'error' ? 'var(--danger)' : 'var(--success)',
        }}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {notification.message}
        </div>
      )}

      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title">Manage Branches</h1>
        {!showAddForm && (
          <button className="btn btn-primary" onClick={() => {
            setNewBranch({ name: '', address: '', managerName: '', whatsAppNumber: '' });
            setEditingId(null);
            setShowAddForm(true);
            setTimeout(() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}>
            + Add Branch
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* ADD / EDIT BRANCH FORM */}
        {showAddForm && (
          <div className="card" style={{ flex: '1', minWidth: '300px' }} ref={formRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Branch' : 'Add New Branch'}</h3>
            </div>
            <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Branch Name</label>
                <input type="text" className="form-control" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Address</label>
                <input type="text" className="form-control" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Manager Name</label>
                <input type="text" className="form-control" value={newBranch.managerName} onChange={e => setNewBranch({...newBranch, managerName: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>WhatsApp Number</label>
                <input type="text" className="form-control" placeholder="+1234567890" value={newBranch.whatsAppNumber} onChange={e => setNewBranch({...newBranch, whatsAppNumber: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, border: 'none', backgroundColor: '#f1f5f9', color: '#0f172a' }} onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST EXISTING BRANCHES */}
        <div className="card" style={{ flex: '2', minWidth: '300px' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th className="hide-on-mobile">Address</th>
                  <th>Manager</th>
                  <th className="hide-on-mobile">WhatsApp Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 'bold' }} data-label="Branch Name">{b.name}</td>
                    <td className="hide-on-mobile" data-label="Address">{b.address || 'N/A'}</td>
                    <td data-label="Manager">{b.managerName || 'N/A'}</td>
                    <td className="hide-on-mobile" data-label="WhatsApp Number">{b.whatsAppNumber || 'N/A'}</td>
                    <td data-label="Status">
                      {b.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditClick(b)}>
                          Edit
                        </button>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDeleteClick(b._id)}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No branches found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBranches;
