import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    mobileNumber: '',
    role: 'MANAGER',
    branch: ''
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

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
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
    fetchUsers();
    fetchBranches();
  }, []);

  const handleEditClick = (user) => {
    setEditingId(user._id);
    setNewUser({
      name: user.name,
      username: user.username,
      password: '', // Never populate password, leave blank unless changing
      mobileNumber: user.mobileNumber || '',
      role: user.role,
      branch: user.branch ? user.branch._id : ''
    });
    setShowAddForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsers();
        showNotification('User deleted successfully!');
      } catch (err) {
        showNotification(err.response?.data?.message || 'Error deleting user', 'error');
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create payload. Remove empty branch if not MANAGER
      const payload = { ...newUser };
      if (payload.role !== 'MANAGER') {
        delete payload.branch;
      }
      // If editing and password is blank, don't send it so we don't overwrite
      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await axios.put(`/api/users/${editingId}`, payload);
        showNotification('User updated successfully!');
      } else {
        await axios.post('/api/users', payload);
        showNotification('User created successfully!');
      }

      setNewUser({ name: '', username: '', password: '', mobileNumber: '', role: 'MANAGER', branch: '' });
      setEditingId(null);
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving user', 'error');
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
        <h1 className="page-title">Manage Users</h1>
        {!showAddForm && (
          <button className="btn btn-primary" onClick={() => {
            setNewUser({ name: '', username: '', password: '', mobileNumber: '', role: 'MANAGER', branch: '' });
            setEditingId(null);
            setShowAddForm(true);
            setTimeout(() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}>
            + Add User
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* ADD / EDIT USER FORM */}
        {showAddForm && (
          <div className="card" style={{ flex: '1', minWidth: '300px' }} ref={formRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit User' : 'Add New User'}</h3>
            </div>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name</label>
                <input type="text" className="form-control" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Username</label>
                <input type="text" className="form-control" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Password {editingId && '(Leave blank to keep unchanged)'}</label>
                <input type="password" className="form-control" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required={!editingId} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mobile Number</label>
                <input type="text" className="form-control" placeholder="+1234567890" value={newUser.mobileNumber} onChange={e => setNewUser({...newUser, mobileNumber: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Role</label>
                <select className="form-control" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager (Branch User)</option>
                  <option value="DELIVERY_BOY">Delivery Boy</option>
                </select>
              </div>
              
              {newUser.role === 'MANAGER' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Assign to Branch</label>
                  <select className="form-control" value={newUser.branch} onChange={e => setNewUser({...newUser, branch: e.target.value})} required>
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
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

        {/* LIST EXISTING USERS */}
        <div className="card" style={{ flex: '2', minWidth: '300px' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th className="hide-on-mobile">Role</th>
                  <th className="hide-on-mobile">Mobile</th>
                  <th className="hide-on-mobile">Branch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 'bold' }} data-label="Name">{u.name}</td>
                    <td data-label="Username">{u.username}</td>
                    <td className="hide-on-mobile" data-label="Role"><span className="badge badge-primary">{u.role}</span></td>
                    <td className="hide-on-mobile" data-label="Mobile">{u.mobileNumber || 'N/A'}</td>
                    <td className="hide-on-mobile" data-label="Branch">{u.branch ? u.branch.name : 'N/A'}</td>
                    <td data-label="Status">
                      {u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditClick(u)}>
                          Edit
                        </button>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDeleteClick(u._id)}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No users found.</td>
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

export default AdminUsers;
