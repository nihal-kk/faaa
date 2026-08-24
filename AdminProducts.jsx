import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    unit: 'PCS',
    minStock: 10,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [notification, setNotification] = useState({ message: '', type: '' });
  const formRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      minStock: product.minStock || 10,
      imageUrl: product.imageUrl || ''
    });
    setPreviewUrl(product.imageUrl || '');
    setImageFile(null);
    setShowAddForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        fetchProducts();
        showNotification('Product deleted successfully!');
      } catch (err) {
        showNotification(err.response?.data?.message || 'Error deleting product', 'error');
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = newProduct.imageUrl;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        finalImageUrl = uploadRes.data.imageUrl;
      }

      if (editingId) {
        await axios.put(`/api/products/${editingId}`, {
          ...newProduct,
          imageUrl: finalImageUrl
        });
        showNotification('Product updated successfully!');
      } else {
        await axios.post('/api/products', {
          ...newProduct,
          imageUrl: finalImageUrl
        });
        showNotification('Product created successfully!');
      }

      setNewProduct({
        name: '', category: '', price: '', unit: 'PCS', minStock: 10, imageUrl: ''
      });
      setImageFile(null);
      setPreviewUrl('');
      setEditingId(null);
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving product', 'error');
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
        <h1 className="page-title">Manage Products</h1>
        {!showAddForm && (
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setNewProduct({ name: '', category: '', price: '', unit: 'PCS', minStock: 10, imageUrl: '' });
            setPreviewUrl('');
            setImageFile(null);
            setShowAddForm(true);
          }}>
            + Add New Product
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

        {/* ADD / EDIT PRODUCT FORM */}
        {showAddForm && (
          <div className="card" style={{ flex: '1', minWidth: '300px' }} ref={formRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => { setShowAddForm(false); setImageFile(null); setPreviewUrl(''); setEditingId(null); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--gray-dark)' }}>&times;</button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label>Name</label>
                <input type="text" className="form-control" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
              </div>
              <div>
                <label>Category</label>
                <input type="text" className="form-control" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} required />
              </div>
              <div>
                <label>Price</label>
                <input type="number" className="form-control" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
              </div>
              <div>
                <label>Unit</label>
                <select className="form-control" value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}>
                  <option value="PCS">PCS</option>
                  <option value="KG">KG</option>
                  <option value="LITRE">LITRE</option>
                  <option value="BOX">BOX</option>
                </select>
              </div>
              <div>
                <label>Min Stock</label>
                <input type="number" className="form-control" value={newProduct.minStock} onChange={e => setNewProduct({ ...newProduct, minStock: e.target.value })} required />
              </div>
              <div>
                <label>Upload Image</label>
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
                      onClick={() => { setImageFile(null); setPreviewUrl(''); setNewProduct({ ...newProduct, imageUrl: '' }); }}
                      style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary mt-2" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingId ? 'Update Product' : 'Add Product')}
              </button>
            </form>
          </div>
        )}

        {/* LIST EXISTING PRODUCTS */}
        <div className="card" style={{ flex: '2', minWidth: '300px' }}>
          <h3>Existing Products</h3>
          <div className="table-container mt-2">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th className="hide-on-mobile">Category</th>
                  <th>Price</th>
                  <th className="hide-on-mobile">Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td data-label="Image">
                      <img src={p.imageUrl || 'https://placehold.co/400x400?text=No+Image'} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    </td>
                    <td style={{ fontWeight: 'bold' }} data-label="Name">{p.name}</td>
                    <td className="hide-on-mobile" data-label="Category">{p.category}</td>
                    <td data-label="Price">₹{p.price}</td>
                    <td className="hide-on-mobile" data-label="Unit">{p.unit}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditClick(p)}>
                          Edit
                        </button>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDeleteClick(p._id)}>
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

export default AdminProducts;
