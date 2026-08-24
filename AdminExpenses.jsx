import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    invoiceUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [notification, setNotification] = useState({ message: '', type: '' });
  const formRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get('/api/expenses');
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (expense) => {
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      category: expense.category || 'Other',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      invoiceUrl: expense.invoiceUrl || ''
    });
    setEditingId(expense._id);
    setPreviewUrl(expense.invoiceUrl || '');
    setImageFile(null);
    setShowAddForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`/api/expenses/${id}`);
        fetchExpenses();
        showNotification('Expense deleted successfully!');
      } catch (err) {
        showNotification(err.response?.data?.message || 'Error deleting expense', 'error');
      }
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalInvoiceUrl = newExpense.invoiceUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        finalInvoiceUrl = uploadRes.data.imageUrl;
      }

      if (editingId) {
        await axios.put(`/api/expenses/${editingId}`, {
          ...newExpense,
          invoiceUrl: finalInvoiceUrl
        });
        showNotification('Expense updated successfully!');
      } else {
        await axios.post('/api/expenses', {
          ...newExpense,
          invoiceUrl: finalInvoiceUrl
        });
        showNotification('Expense created successfully!');
      }

      setNewExpense({
        description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], invoiceUrl: ''
      });
      setImageFile(null);
      setPreviewUrl('');
      setShowAddForm(false);
      setEditingId(null);
      fetchExpenses();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - today.getDay()); // Start of week (Sunday)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const dailyTotal = expenses.filter(e => new Date(e.date) >= startOfDay).reduce((sum, e) => sum + e.amount, 0);
  const weeklyTotal = expenses.filter(e => new Date(e.date) >= startOfWeek).reduce((sum, e) => sum + e.amount, 0);
  const monthlyTotal = expenses.filter(e => new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
        <h1 className="page-title">Manage Expenses</h1>
        {!showAddForm && (
          <button className="btn btn-primary" onClick={() => {
            setNewExpense({ description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], invoiceUrl: '' });
            setPreviewUrl('');
            setImageFile(null);
            setEditingId(null);
            setShowAddForm(true);
            setTimeout(() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}>
            + Add Expense
          </button>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">Today's Expenses</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem', color: 'var(--danger)' }}>₹{dailyTotal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">This Week</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem', color: '#f59e0b' }}>₹{weeklyTotal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">This Month</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem' }}>₹{monthlyTotal.toLocaleString()}</p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p className="text-xs font-bold text-muted uppercase">Total</p>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginTop: '1rem', color: 'var(--primary, #3b82f6)' }}>₹{totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

        {/* ADD EXPENSE FORM */}
        {showAddForm && (
          <div className="card" style={{ flex: '1', minWidth: '300px' }} ref={formRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description</label>
                <input type="text" className="form-control" placeholder="e.g. Monthly rent" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Amount (₹)</label>
                <input type="number" className="form-control" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Category</label>
                <select className="form-control" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Maintenance">Raw Materials</option>
                  <option value="Maintenance">Purchase</option>
                  <option value="Maintenance">EMI</option>
                  <option value="Maintenance">Packaging</option>
                  <option value="Maintenance">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date</label>
                <input type="date" className="form-control" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Upload Invoice <span className="text-muted" style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(Optional)</span></label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {previewUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={previewUrl} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }} />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setPreviewUrl(''); setNewExpense({ ...newExpense, invoiceUrl: '' }); }}
                      style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, border: 'none', backgroundColor: '#f1f5f9', color: '#0f172a' }} onClick={() => { setShowAddForm(false); setEditingId(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }} disabled={isSubmitting}>
                  {isSubmitting ? (editingId ? 'Updating...' : 'Saving...') : (editingId ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST EXISTING EXPENSES */}
        <div className="card" style={{ flex: '2', minWidth: '300px' }}>
          <h3>Recent Expenses</h3>
          <div className="table-container mt-2">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="hide-on-mobile">Category</th>
                  <th>Amount</th>
                  <th>Invoice</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-dark)' }}>No expenses recorded yet.</td>
                  </tr>
                ) : expenses.map(e => (
                  <tr key={e._id}>
                    <td style={{ whiteSpace: 'nowrap' }} data-label="Date">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontWeight: 'bold' }} data-label="Description">{e.description}</td>
                    <td className="hide-on-mobile" data-label="Category">
                      <span className="badge" style={{ backgroundColor: 'var(--gray-light)', color: 'var(--gray-dark)' }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }} data-label="Amount">₹{e.amount?.toLocaleString()}</td>
                    <td data-label="Invoice">
                      {e.invoiceUrl ? (
                        <a href={e.invoiceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'underline' }}>
                          View
                        </a>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => handleEditClick(e)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDeleteClick(e._id)}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminExpenses;
