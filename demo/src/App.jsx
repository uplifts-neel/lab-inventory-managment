import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import LoginSignup from './component/loginsignup/loginsignup'
import Sidebar from './component/sidebar/Sidebar'
import { AuthProvider, AuthContext } from './context/AuthContext'; // To be created
import ProtectedRoute from './component/ProtectedRoute';
import { useContext } from 'react';
import Users from './component/users/Users';
import axios from 'axios';

// Placeholder components for each section
const Dashboard = () => {
  const [metrics, setMetrics] = useState({ assets: 0, assigned: 0, unassigned: 0, users: 0, divisions: 0 });
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, usersRes, divisionsRes, expiringRes] = await Promise.all([
          axios.get('/api/assets'),
          axios.get('/api/users'),
          axios.get('/api/divisions'),
          axios.get('/api/assets?expiring=true'),
        ]);
        const assets = assetsRes.data;
        const assigned = assets.filter(a => a.assignedTo).length;
        const unassigned = assets.length - assigned;
        setMetrics({
          assets: assets.length,
          assigned,
          unassigned,
          users: usersRes.data.length,
          divisions: divisionsRes.data.length,
        });
        setExpiring(expiringRes.data);
      } catch (e) {
        // fallback to zeroes
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#393e6e', padding: 24, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Total Assets</div>
          <div style={{ fontSize: 32 }}>{metrics.assets}</div>
        </div>
        <div style={{ background: '#393e6e', padding: 24, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Assigned</div>
          <div style={{ fontSize: 32 }}>{metrics.assigned}</div>
        </div>
        <div style={{ background: '#393e6e', padding: 24, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Unassigned</div>
          <div style={{ fontSize: 32 }}>{metrics.unassigned}</div>
        </div>
        <div style={{ background: '#393e6e', padding: 24, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Users</div>
          <div style={{ fontSize: 32 }}>{metrics.users}</div>
        </div>
        <div style={{ background: '#393e6e', padding: 24, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Divisions</div>
          <div style={{ fontSize: 32 }}>{metrics.divisions}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 2 }}>
          <h3>Expiry Alerts</h3>
          {expiring.length === 0 ? <div>No assets expiring soon.</div> : (
            <ul>
              {expiring.map(asset => (
                <li key={asset._id}>
                  {asset.name} ({asset.serialNo}) - Expiry: {asset.expiryDate}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="/amc" style={{ color: '#eebbc3' }}>AMC Tickets</a></li>
            <li><a href="/assignments" style={{ color: '#eebbc3' }}>Assignments</a></li>
            <li><a href="/assets?expiring=true" style={{ color: '#eebbc3' }}>Expiring Assets</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const ASSET_TYPES = [
  'PC', 'Printer', 'Switch', 'NAS', 'Scanner', 'Workstation', 'Server', 'Router', 'Props'
];

const ASSET_STATUS = [
  'Assigned', 'Unassigned', 'In Repair', 'In AMC'
];

const AssetForm = ({ onClose, onSubmit, initial = {} }) => {
  const { token } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: initial.name || '',
    type: initial.type || '',
    brand: initial.brand || '',
    model: initial.model || '',
    serialNo: initial.serialNo || '',
    status: initial.status || 'Unassigned',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(form, token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating asset');
    }
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <select name="type" value={form.type} onChange={handleChange} required>
        <option value="">Select Type</option>
        {ASSET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
      </select>
      <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} required />
      <input name="model" placeholder="Model" value={form.model} onChange={handleChange} required />
      <input name="serialNo" placeholder="Serial No" value={form.serialNo} onChange={handleChange} required />
      <select name="status" value={form.status} onChange={handleChange} required>
        {ASSET_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
      </select>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
};

const AssignForm = ({ asset, onClose, onSubmit }) => {
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
        if (res.data.length === 0) {
          setError('No users found. Please add some users first.');
        }
      } catch (err) {
        setError('Error loading users: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  const createSampleUser = async () => {
    try {
      const sampleUser = {
        name: 'Sample User',
        email: 'sample@example.com',
        password: 'password123',
        role: 'Trainee'
      };
      await axios.post('/api/auth/signup', sampleUser);
      // Refresh users list
      const res = await axios.get('/api/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError('Error creating sample user: ' + (err.response?.data?.message || err.message));
    }
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) {
      setError('Please select a user');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(userId);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>Assign <b>{asset.name}</b> to:</div>
      {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}
      <select value={userId} onChange={e => setUserId(e.target.value)} required>
        <option value="">Select user</option>
        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
      </select>
      {users.length === 0 && (
        <button type="button" onClick={createSampleUser} style={{ background: '#4CAF50', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Create Sample User
        </button>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading || users.length === 0 || submitting}>
          {loading ? 'Loading...' : submitting ? 'Assigning...' : 'Assign'}
        </button>
        <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
      </div>
    </form>
  );
};

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null); // asset id
  const [showAssign, setShowAssign] = useState(null); // asset id
  const { token } = useContext(AuthContext);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/assets?search=${search}&page=${page}`);
      // Always handle both paginated and non-paginated responses
      const data = res.data;
      let assetList = [];
      let total = 1;
      if (Array.isArray(data)) {
        assetList = data;
      } else if (data.assets) {
        assetList = data.assets;
        total = data.totalPages || 1;
      }
      setAssets(assetList);
      setTotalPages(total);
    } catch (e) {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, [search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    await axios.delete(`/api/assets/${id}`);
    fetchAssets();
  };

  const handleExport = async () => {
    window.open('/api/assets/export', '_blank');
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await axios.post('/api/assets/import', formData);
    fetchAssets();
  };

  const handleAdd = async (form, token) => {
    await axios.post('/api/assets', form, { headers: { Authorization: `Bearer ${token}` } });
    setShowAdd(false);
    fetchAssets();
  };

  const handleEdit = async (form) => {
    await axios.put(`/api/assets/${showEdit._id}`, form);
    setShowEdit(null);
    fetchAssets();
  };

    const handleAssign = async (userId) => {
    try {
      console.log('=== FRONTEND: Assigning asset ===');
      console.log('Asset:', showAssign);
      console.log('User ID:', userId);
      
      const assignmentData = {
        asset: showAssign._id,
        assignedTo: userId,
        assignedToModel: 'User',
        assignedBy: '60d5ec49f8c7d10015f8e123', // Using valid ObjectId as mock user
        action: 'Assign',
        remarks: ''
      };
      
      console.log('Assignment data:', assignmentData);
      
      const response = await axios.post('/api/assignments', assignmentData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Assignment created successfully:', response.data);
      setShowAssign(null);
      fetchAssets();
    } catch (err) {
      console.error('=== FRONTEND: Error assigning asset ===');
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      // Don't show error for duplicate assignments
      if (err.response?.status === 409) {
        console.log('Assignment already exists, closing dialog...');
        setShowAssign(null);
        fetchAssets();
        return;
      }
      
      alert(err.response?.data?.message || err.response?.data?.error || 'Error creating assignment');
    }
  };

  const insertSampleAssets = async () => {
    const samples = [
      { name: 'Sample PC', type: 'PC', brand: 'Dell', model: 'Optiplex', serialNo: 'PC1001', status: 'Unassigned' },
      { name: 'Sample Printer', type: 'Printer', brand: 'HP', model: 'LaserJet', serialNo: 'PR2002', status: 'Unassigned' },
      { name: 'Sample NAS', type: 'NAS', brand: 'Synology', model: 'DS220+', serialNo: 'NAS3003', status: 'Unassigned' },
    ];
    for (const asset of samples) {
      try {
        await axios.post('/api/assets', asset, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        // ignore errors (e.g., duplicate serialNo)
      }
    }
    fetchAssets();
  };

  return (
    <div>
      <h2>Assets</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <button onClick={() => setShowAdd(true)}>Add Asset</button>
        <button onClick={handleExport}>Export CSV</button>
        <label style={{ display: 'inline-block', background: '#393e6e', color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
          Upload CSV
          <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
        <button onClick={insertSampleAssets}>Add Sample Assets</button>
      </div>
      {loading ? <div>Loading assets...</div> : (
        <table style={{ width: '100%', background: '#232946', color: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Serial No</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? <tr><td colSpan={8}>No assets found.</td></tr> : assets.map(asset => (
              <tr key={asset._id}>
                <td>{asset.name}</td>
                <td>{asset.type}</td>
                <td>{asset.brand}</td>
                <td>{asset.model}</td>
                <td>{asset.serialNo}</td>
                <td>{asset.status}</td>
                <td>{asset.assignedTo ? asset.assignedTo.name : 'Unassigned'}</td>
                <td>
                  <button onClick={() => setShowEdit(asset)}>Edit</button>
                  <button onClick={() => handleDelete(asset._id)}>Delete</button>
                  <button onClick={() => setShowAssign(asset)}>Assign</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 16 }}>
        Page: {page} / {totalPages}
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
      </div>
      {showAdd && <div style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <h3>Add Asset</h3>
        <AssetForm onClose={() => setShowAdd(false)} onSubmit={handleAdd} initial={showAdd} />
      </div>}
      {showEdit && <div style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <h3>Edit Asset</h3>
        <AssetForm onClose={() => setShowEdit(null)} onSubmit={handleEdit} initial={showEdit} />
      </div>}
      {showAssign && <div style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <h3>Assign Asset</h3>
        <AssignForm asset={showAssign} onClose={() => setShowAssign(null)} onSubmit={handleAssign} />
      </div>}
    </div>
  );
};
const Divisions = () => {
  const { token } = useContext(AuthContext);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null); // division object
  const [form, setForm] = useState({ name: '', parent: '' });
  const [formError, setFormError] = useState('');

  const fetchDivisions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/divisions', { headers: { Authorization: `Bearer ${token}` } });
      setDivisions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch divisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDivisions(); }, [token]);

  const handleAdd = () => {
    setForm({ name: '', parent: '' });
    setFormError('');
    setShowAdd(true);
  };
  const handleEdit = (division) => {
    setForm({ name: division.name, parent: division.parent || '' });
    setFormError('');
    setShowEdit(division);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this division?')) return;
    try {
      await axios.delete(`/api/divisions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchDivisions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete division');
    }
  };
  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFormSubmit = async e => {
    e.preventDefault();
    if (!form.name) {
      setFormError('Name is required');
      return;
    }
    try {
      console.log('=== FRONTEND: Submitting division form ===');
      console.log('Form data:', form);
      console.log('Token:', token);
      console.log('Is edit mode:', !!showEdit);
      
      if (showEdit) {
        const response = await axios.put(`/api/divisions/${showEdit._id}`, form, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Division updated successfully:', response.data);
        setShowEdit(null);
      } else {
        const response = await axios.post('/api/divisions', form, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Division created successfully:', response.data);
        setShowAdd(false);
      }
      fetchDivisions();
    } catch (err) {
      console.error('=== FRONTEND: Error saving division ===');
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to save division');
    }
  };
  return (
    <div>
      <h2>Divisions</h2>
      <button onClick={handleAdd} style={{ marginBottom: 16 }}>Add Division</button>
      {loading ? <div>Loading divisions...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <table style={{ width: '100%', background: '#fff', color: '#232946', borderRadius: 8 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Parent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {divisions.length === 0 ? <tr><td colSpan={3}>No divisions found.</td></tr> : divisions.map(d => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.parent ? (divisions.find(x => x._id === d.parent)?.name || '-') : '-'}</td>
                <td>
                  <button onClick={() => handleEdit(d)}>Edit</button>
                  <button style={{ marginLeft: 8 }} onClick={() => handleDelete(d._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Add/Edit Modal */}
      {(showAdd || showEdit) && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3>{showEdit ? 'Edit Division' : 'Add Division'}</h3>
            <div style={{ marginBottom: 8 }}>
              <input name="name" value={form.name} onChange={handleFormChange} placeholder="Division Name" style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <select name="parent" value={form.parent} onChange={handleFormChange} style={{ width: '100%', padding: 8 }}>
                <option value="">No Parent</option>
                {divisions.filter(d => !showEdit || d._id !== showEdit._id).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowAdd(false); setShowEdit(null); }} style={{ marginRight: 8 }}>Cancel</button>
              <button type="submit">{showEdit ? 'Save' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
const Assignments = () => {
  const { token, user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [showHistory, setShowHistory] = useState(null); // asset object
  const [form, setForm] = useState({ asset: '', assignedTo: '', assignedToModel: 'User', action: 'Assign', remarks: '' });
  const [formError, setFormError] = useState('');
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [assignmentsRes, assetsRes, usersRes] = await Promise.all([
        axios.get('/api/assignments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAssignments(assignmentsRes.data);
      setAssets(assetsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignments/assets/users');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, [token]);

  const handleAssign = () => {
    setForm({ asset: '', assignedTo: '', assignedToModel: 'User', action: 'Assign', remarks: '' });
    setFormError('');
    setShowAssign(true);
  };
  
  const handleTransfer = (assignment) => {
    setForm({ 
      asset: assignment.asset._id, 
      assignedTo: '', 
      assignedToModel: 'User', 
      action: 'Transfer', 
      remarks: `Transferred from ${assignment.assignedTo?.name || 'previous user'}` 
    });
    setFormError('');
    setShowAssign(true);
  };
  
  const handleReturn = async (assignment) => {
    if (!window.confirm('Unassign/Return this asset?')) return;
    try {
      await axios.put(`/api/assignments/${assignment._id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return asset');
    }
  };
  
  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleFormSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    
    if (!form.asset || !form.assignedTo || !form.action) {
      setFormError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    
    try {
      await axios.post('/api/assignments', {
        asset: form.asset,
        assignedTo: form.assignedTo,
        assignedToModel: form.assignedToModel,
        assignedBy: '60d5ec49f8c7d10015f8e123', // Using valid ObjectId as mock user
        action: form.action,
        remarks: form.remarks
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowAssign(false);
      fetchAll();
    } catch (err) {
      // Don't show error for duplicate assignments
      if (err.response?.status === 409) {
        console.log('Assignment already exists, closing dialog...');
        setShowAssign(false);
        fetchAll();
        return;
      }
      setFormError(err.response?.data?.message || 'Failed to assign/transfer asset');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleShowHistory = async (asset) => {
    setShowHistory(asset);
    setHistory([]);
    try {
      const res = await axios.get(`/api/assets/${asset._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data.assignmentHistory || []);
    } catch (err) {
      setHistory([]);
    }
  };
  return (
    <div>
      <h2>Assignments</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Assignments</h2>
        <button 
          onClick={handleAssign} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: 4, 
            border: 'none', 
            background: '#007bff', 
            color: 'white', 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Assign New Asset
        </button>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading assignments...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: 16, background: '#ffe6e6', borderRadius: 4 }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', color: '#232946', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Asset</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Assigned To</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Assigned By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Remarks</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>History</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
                    No assignments found. Click "Assign New Asset" to create your first assignment.
                  </td>
                </tr>
              ) : assignments.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{a.asset?.name || a.asset?.serialNo || '-'}</div>
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>{a.asset?.type || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{a.assignedTo?.name || '-'}</div>
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>{a.assignedTo?.role || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{a.assignedBy?.name || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {a.date ? new Date(a.date).toLocaleDateString() : '-'}
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>
                      {a.date ? new Date(a.date).toLocaleTimeString() : '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 12, 
                      fontSize: '0.875em',
                      background: a.action === 'Assign' ? '#d4edda' : a.action === 'Transfer' ? '#fff3cd' : '#f8d7da',
                      color: a.action === 'Assign' ? '#155724' : a.action === 'Transfer' ? '#856404' : '#721c24'
                    }}>
                      {a.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                    <div style={{ wordBreak: 'break-word' }}>{a.remarks || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      onClick={() => handleShowHistory(a.asset)} 
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        border: '1px solid #007bff', 
                        background: 'transparent', 
                        color: '#007bff', 
                        cursor: 'pointer',
                        fontSize: '0.875em'
                      }}
                    >
                      View
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        onClick={() => handleTransfer(a)} 
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          border: '1px solid #ffc107', 
                          background: 'transparent', 
                          color: '#856404', 
                          cursor: 'pointer',
                          fontSize: '0.875em'
                        }}
                      >
                        Transfer
                      </button>
                      <button 
                        onClick={() => handleReturn(a)} 
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          border: '1px solid #dc3545', 
                          background: 'transparent', 
                          color: '#721c24', 
                          cursor: 'pointer',
                          fontSize: '0.875em'
                        }}
                      >
                        Unassign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Assign/Transfer Modal */}
      {showAssign && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 400 }}>
            <h3>{form.action === 'Transfer' ? 'Transfer Asset' : 'Assign Asset'}</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Asset:</label>
              <select 
                name="asset" 
                value={form.asset} 
                onChange={handleFormChange} 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} 
                required
                disabled={form.action === 'Transfer'}
              >
                <option value="">Select Asset</option>
                {assets.filter(a => a.status !== 'In Repair' && a.status !== 'In AMC').map(a => (
                  <option key={a._id} value={a._id}>
                    {a.name || a.serialNo} ({a.status})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Assign To:</label>
              <select 
                name="assignedTo" 
                value={form.assignedTo} 
                onChange={handleFormChange} 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} 
                required
              >
                <option value="">Select User</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Action:</label>
              <select 
                name="action" 
                value={form.action} 
                onChange={handleFormChange} 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} 
                required
              >
                <option value="Assign">Assign</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Remarks:</label>
              <textarea 
                name="remarks" 
                value={form.remarks} 
                onChange={handleFormChange} 
                placeholder="Optional remarks about this assignment..." 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', minHeight: 60, resize: 'vertical' }}
              />
            </div>
            
            {formError && <div style={{ color: 'red', marginBottom: 16, padding: 8, background: '#ffe6e6', borderRadius: 4 }}>{formError}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button 
                type="button" 
                onClick={() => setShowAssign(false)} 
                style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  border: 'none', 
                  background: submitting ? '#ccc' : '#007bff', 
                  color: 'white', 
                  cursor: submitting ? 'not-allowed' : 'pointer' 
                }}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : (form.action === 'Transfer' ? 'Transfer' : 'Assign')}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Assignment History Modal */}
      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Assignment History for {showHistory.name || showHistory.serialNo}</h3>
              <button 
                onClick={() => setShowHistory(null)} 
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  border: '1px solid #ddd', 
                  background: '#f5f5f5', 
                  cursor: 'pointer' 
                }}
              >
                ✕
              </button>
            </div>
            
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                No assignment history found for this asset.
              </div>
            ) : (
              <div style={{ background: '#fff', color: '#232946', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Action</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Assigned To</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={{ padding: '12px 16px' }}>
                          {h.date ? new Date(h.date).toLocaleDateString() : '-'}
                          <div style={{ fontSize: '0.875em', color: '#6c757d' }}>
                            {h.date ? new Date(h.date).toLocaleTimeString() : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: 12, 
                            fontSize: '0.875em',
                            background: h.action === 'Assign' ? '#d4edda' : h.action === 'Transfer' ? '#fff3cd' : '#f8d7da',
                            color: h.action === 'Assign' ? '#155724' : h.action === 'Transfer' ? '#856404' : '#721c24'
                          }}>
                            {h.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {h.assignedTo || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {h.assignedToModel || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
const AMC_STATUSES = ['Open', 'In Progress', 'Closed'];
const AMC = () => {
  const { token, user } = useContext(AuthContext);
  const [amcs, setAMCs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showRemark, setShowRemark] = useState(null); // amc object
  const [form, setForm] = useState({ asset: '', assignedTo: '', status: 'Open', remarks: '' });
  const [formError, setFormError] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [amcRes, assetsRes, usersRes] = await Promise.all([
        axios.get('/api/amc', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAMCs(amcRes.data);
      setAssets(assetsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch AMC tickets/assets/users');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, [token]);

  const handleAdd = () => {
    setForm({ asset: '', assignedTo: '', status: 'Open', remarks: '' });
    setFormError('');
    setShowAdd(true);
  };
  
  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleFormSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    
    if (!form.asset || !form.status) {
      setFormError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    
    try {
      await axios.post('/api/amc', {
        asset: form.asset,
        raisedBy: user?._id,
        assignedTo: form.assignedTo || undefined,
        status: form.status,
        remarks: form.remarks
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowAdd(false);
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create AMC ticket');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRemark = (amc) => {
    setShowRemark(amc);
    setRemark('');
  };
  
  const handleRemarkSubmit = async e => {
    e.preventDefault();
    if (!remark.trim()) {
      alert('Please enter a remark.');
      return;
    }
    
    try {
      await axios.put(`/api/amc/${showRemark._id}`, { 
        remarks: remark, 
        status: showRemark.status 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowRemark(null);
      setRemark('');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add remark');
    }
  };
  
  const handleResolve = async (amc) => {
    if (!window.confirm('Mark this AMC ticket as resolved?')) return;
    
    try {
      await axios.put(`/api/amc/${amc._id}`, { 
        status: 'Closed' 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve AMC ticket');
    }
  };
  
  const filteredAMCs = filter === 'All' ? amcs : amcs.filter(a => a.status === filter);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>AMC Tickets</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            style={{ 
              padding: '8px 12px', 
              borderRadius: 4, 
              border: '1px solid #ddd',
              background: '#fff',
              color: '#232946'
            }}
          >
            <option value="All">All Tickets</option>
            {AMC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            onClick={handleAdd} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: 4, 
              border: 'none', 
              background: '#007bff', 
              color: 'white', 
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Raise Ticket
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading AMC tickets...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: 16, background: '#ffe6e6', borderRadius: 4 }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', color: '#232946', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Asset</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Raised By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Assigned To</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Remarks</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAMCs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
                    No AMC tickets found. Click "Raise Ticket" to create your first ticket.
                  </td>
                </tr>
              ) : filteredAMCs.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{a.asset?.name || a.asset?.serialNo || '-'}</div>
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>
                      {a.asset?.type} - {a.asset?.brand} {a.asset?.model}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{a.raisedBy?.name || '-'}</div>
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>{a.raisedBy?.email || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{a.assignedTo?.name || '-'}</div>
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>{a.assignedTo?.email || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 12, 
                      fontSize: '0.875em',
                      background: a.status === 'Open' ? '#fff3cd' : a.status === 'In Progress' ? '#d1ecf1' : '#d4edda',
                      color: a.status === 'Open' ? '#856404' : a.status === 'In Progress' ? '#0c5460' : '#155724'
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: 200 }}>
                    <div style={{ wordBreak: 'break-word' }}>{a.remarks || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}
                    <div style={{ fontSize: '0.875em', color: '#6c757d' }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        onClick={() => handleRemark(a)} 
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          border: '1px solid #007bff', 
                          background: 'transparent', 
                          color: '#007bff', 
                          cursor: 'pointer',
                          fontSize: '0.875em'
                        }}
                      >
                        Add Remark
                      </button>
                      {a.status !== 'Closed' && (
                        <button 
                          onClick={() => handleResolve(a)} 
                          style={{ 
                            padding: '4px 8px', 
                            borderRadius: 4, 
                            border: '1px solid #28a745', 
                            background: 'transparent', 
                            color: '#28a745', 
                            cursor: 'pointer',
                            fontSize: '0.875em'
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Raise Ticket Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 400 }}>
            <h3>Raise AMC Ticket</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Asset:</label>
              <select 
                name="asset" 
                value={form.asset} 
                onChange={handleFormChange} 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} 
                required
              >
                <option value="">Select Asset</option>
                {assets.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.name || a.serialNo} ({a.type} - {a.brand} {a.model})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Assign To:</label>
              <select 
                name="assignedTo" 
                value={form.assignedTo} 
                onChange={handleFormChange} 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              >
                <option value="">Assign To (optional)</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Status:</label>
              <select 
                name="status" 
                value={form.status} 
                onChange={handleFormChange} 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} 
                required
              >
                {AMC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Remarks:</label>
              <textarea 
                name="remarks" 
                value={form.remarks} 
                onChange={handleFormChange} 
                placeholder="Describe the issue or request..." 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', minHeight: 80, resize: 'vertical' }}
              />
            </div>
            
            {formError && <div style={{ color: 'red', marginBottom: 16, padding: 8, background: '#ffe6e6', borderRadius: 4 }}>{formError}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button 
                type="button" 
                onClick={() => setShowAdd(false)} 
                style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  border: 'none', 
                  background: submitting ? '#ccc' : '#007bff', 
                  color: 'white', 
                  cursor: submitting ? 'not-allowed' : 'pointer' 
                }}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Raise Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Add Remark Modal */}
      {showRemark && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleRemarkSubmit} style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 400 }}>
            <h3>Add Remark to AMC Ticket</h3>
            <p style={{ marginBottom: 16, color: '#6c757d', fontSize: '0.875em' }}>
              Asset: <strong>{showRemark.asset?.name || showRemark.asset?.serialNo}</strong>
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Remark:</label>
              <textarea 
                value={remark} 
                onChange={e => setRemark(e.target.value)} 
                placeholder="Enter your remark or update..." 
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', minHeight: 80, resize: 'vertical' }} 
                required 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button 
                type="button" 
                onClick={() => setShowRemark(null)} 
                style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  border: 'none', 
                  background: '#007bff', 
                  color: 'white', 
                  cursor: 'pointer' 
                }}
              >
                Add Remark
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
const Audit = () => {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [user, setUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsRes, usersRes] = await Promise.all([
        axios.get(`/api/logs?${action ? `action=${action}&` : ''}${user ? `user=${user}&` : ''}${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setLogs(logsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch logs/users');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, [token, action, user, startDate, endDate]);

  return (
    <div>
      <h2>Audit Logs</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <select value={user} onChange={e => setUser(e.target.value)} style={{ padding: 8 }}>
          <option value="">All Users</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
        </select>
        <input placeholder="Action" value={action} onChange={e => setAction(e.target.value)} style={{ padding: 8 }} />
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: 8 }} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: 8 }} />
        <button onClick={() => { setUser(''); setAction(''); setStartDate(''); setEndDate(''); }}>Clear Filters</button>
      </div>
      {loading ? <div>Loading logs...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <table style={{ width: '100%', background: '#fff', color: '#232946', borderRadius: 8 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? <tr><td colSpan={6}>No logs found.</td></tr> : logs.map(log => (
              <tr key={log._id}>
                <td>{log.date ? new Date(log.date).toLocaleString() : '-'}</td>
                <td>{log.user?.name || '-'}</td>
                <td>{log.action}</td>
                <td>{log.targetType}</td>
                <td>{log.targetId}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
const Settings = () => {
  const { token, user, logout, updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState('');
  const [pwMode, setPwMode] = useState(false);
  const [pwForm, setPwForm] = useState({ password: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // Try /api/users/me, fallback to /api/users/:id
        let res;
        try {
          res = await axios.get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
        } catch {
          res = await axios.get(`/api/users/${user?._id}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        setProfile(res.data);
        setForm({ name: res.data.name, email: res.data.email });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, user]);

  const handleEdit = () => {
    setEditMode(true);
    setFormError('');
  };
  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFormSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setFormError('Name and email are required.');
      return;
    }
    try {
      await axios.put(`/api/users/${user?._id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      setEditMode(false);
      setProfile({ ...profile, ...form });
      updateUser({ ...user, ...form }); // Update context user
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update profile');
    }
  };
  const handlePwChange = e => setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  const handlePwSubmit = async e => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!pwForm.password || !pwForm.newPassword || !pwForm.confirm) {
      setPwError('All fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    try {
      await axios.put(`/api/users/${user?._id}`, { password: pwForm.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setPwSuccess('Password updated successfully.');
      setPwForm({ password: '', newPassword: '', confirm: '' });
      setPwMode(false);
      logout(); // Force re-login after password change
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password');
    }
  };
  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  return (
    <div>
      <h2>Profile / Settings</h2>
      <div style={{ background: '#fff', color: '#232946', borderRadius: 8, padding: 24, maxWidth: 400 }}>
        <div><b>Name:</b> {profile?.name}</div>
        <div><b>Email:</b> {profile?.email}</div>
        <div><b>Role:</b> {profile?.role}</div>
        <button onClick={handleEdit} style={{ marginTop: 16 }}>Edit Profile</button>
        <button onClick={() => setPwMode(true)} style={{ marginLeft: 8, marginTop: 16 }}>Change Password</button>
      </div>
      {/* Edit Profile Modal */}
      {editMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3>Edit Profile</h3>
            <input name="name" value={form.name} onChange={handleFormChange} placeholder="Name" style={{ width: '100%', padding: 8, marginBottom: 8 }} required />
            <input name="email" value={form.email} onChange={handleFormChange} placeholder="Email" type="email" style={{ width: '100%', padding: 8, marginBottom: 8 }} required />
            {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditMode(false)} style={{ marginRight: 8 }}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
      {/* Change Password Modal */}
      {pwMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handlePwSubmit} style={{ background: '#fff', color: '#232946', padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3>Change Password</h3>
            <input name="password" value={pwForm.password} onChange={handlePwChange} placeholder="Current Password" type="password" style={{ width: '100%', padding: 8, marginBottom: 8 }} required />
            <input name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} placeholder="New Password" type="password" style={{ width: '100%', padding: 8, marginBottom: 8 }} required />
            <input name="confirm" value={pwForm.confirm} onChange={handlePwChange} placeholder="Confirm New Password" type="password" style={{ width: '100%', padding: 8, marginBottom: 8 }} required />
            {pwError && <div style={{ color: 'red', marginBottom: 8 }}>{pwError}</div>}
            {pwSuccess && <div style={{ color: 'green', marginBottom: 8 }}>{pwSuccess}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setPwMode(false)} style={{ marginRight: 8 }}>Cancel</button>
              <button type="submit">Change</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthContext.Consumer>
          {({ user, isAdmin, isStaff, isTrainee, isGuest }) => (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
              <Sidebar isAdmin={isAdmin} isStaff={isStaff} isTrainee={isTrainee} isGuest={isGuest} />
              <div style={{ marginLeft: 220, flex: 1, padding: '32px', background: '#232946', color: '#fff' }}>
                <Routes>
                  <Route path="/login" element={<Navigate to="/dashboard" />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute requiredRole="Admin"><Users /></ProtectedRoute>} />
                  <Route path="/divisions" element={<ProtectedRoute><Divisions /></ProtectedRoute>} />
                  <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
                  <Route path="/amc" element={<ProtectedRoute><AMC /></ProtectedRoute>} />
                  <Route path="/audit" element={<ProtectedRoute requiredRole="Admin"><Audit /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/logout" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          )}
        </AuthContext.Consumer>
      </Router>
    </AuthProvider>
  )
}

export default App
