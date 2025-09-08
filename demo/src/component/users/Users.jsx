import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const roles = ['Admin', 'Staff', 'Trainee', 'Guest'];

const Users = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Trainee', division: '', mentor: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, divisionsRes] = await Promise.all([
          axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/divisions', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        console.log('Fetched users:', usersRes.data);
        console.log('Fetched divisions:', divisionsRes.data);
        setUsers(usersRes.data);
        setDivisions(divisionsRes.data);
        setMentors(usersRes.data.filter(u => u.role === 'Admin' || u.role === 'Staff'));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users/divisions');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.division?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = () => {
    setForm({ name: '', email: '', password: '', role: 'Trainee', division: '', mentor: '' });
    setFormError('');
    setEditId(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    console.log('Editing user:', user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '', // Empty for edit
      role: user.role || 'Trainee',
      division: user.division?._id || '',
      mentor: user.mentor?._id || '',
    });
    setFormError('');
    setEditId(user._id);
    setShowModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleAddSampleUser = async () => {
    try {
      const sampleUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'Staff',
        division: '',
        mentor: ''
      };
      
      const response = await axios.post('/api/users', sampleUser, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Sample user created:', response.data);
      
      // Refresh users
      const usersRes = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(usersRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create sample user');
    }
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.email || !form.role) {
      setFormError('Please fill all required fields.');
      return;
    }
    
    // Password is required only for new users
    if (!editId && !form.password) {
      setFormError('Password is required for new users.');
      return;
    }

    try {
      const submitData = { ...form };
      if (editId && !form.password) {
        // Remove password field if editing and no password provided
        delete submitData.password;
      }

      console.log('Submitting user data:', submitData);

      if (editId) {
        // Edit user
        const response = await axios.put(`/api/users/${editId}`, submitData, { headers: { Authorization: `Bearer ${token}` } });
        console.log('User updated successfully:', response.data);
      } else {
        // Add user
        const response = await axios.post('/api/users', submitData, { headers: { Authorization: `Bearer ${token}` } });
        console.log('User created successfully:', response.data);
      }
      
      // Refresh users
      const usersRes = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(usersRes.data);
    setShowModal(false);
    } catch (err) {
      console.error('Error saving user:', err.response?.data || err.message);
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to save user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <h2>User Management</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, width: 240 }}
        />
        <button style={{ marginLeft: 16 }} onClick={handleAddUser}>Add User</button>
        <button style={{ marginLeft: 8 }} onClick={handleAddSampleUser}>Add Sample User</button>
      </div>
      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div>
          <div style={{ marginBottom: 8, color: '#fff' }}>
            Total users: {users.length}, Filtered users: {filteredUsers.length}
          </div>
          <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', background: '#fff', color: '#000' }}>
          <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Name</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Email</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Role</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Division</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Mentor</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Joined</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Left</th>
                <th style={{ color: '#000', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#000' }}>
                    {users.length === 0 ? 'No users found. Add some users to get started!' : 'No users match your search.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id || user.id} style={{ color: '#000' }}>
                    <td style={{ color: '#000' }}>{user.name || '-'}</td>
                    <td style={{ color: '#000' }}>{user.email || '-'}</td>
                    <td style={{ color: '#000' }}>{user.role || '-'}</td>
                    <td style={{ color: '#000' }}>{user.division?.name || '-'}</td>
                    <td style={{ color: '#000' }}>{user.mentor?.name || '-'}</td>
                    <td style={{ color: '#000' }}>{formatDate(user.joinDate)}</td>
                    <td style={{ color: '#000' }}>{formatDate(user.leaveDate)}</td>
                <td>
                      <button onClick={() => handleEditUser(user)}>Edit</button>
                      <button style={{ marginLeft: 8 }} onClick={() => handleDeleteUser(user._id)}>Delete</button>
                </td>
              </tr>
                ))
              )}
          </tbody>
        </table>
        </div>
      )}
      {/* Modal for Add/Edit User */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }}>
            <h3>{editId ? 'Edit User' : 'Add User'}</h3>
            <div style={{ marginBottom: 8 }}>
              <input name="name" value={form.name} onChange={handleFormChange} placeholder="Name" style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input name="email" value={form.email} onChange={handleFormChange} placeholder="Email" type="email" style={{ width: '100%', padding: 8 }} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input name="password" value={form.password} onChange={handleFormChange} placeholder={editId ? "Password (leave blank to keep current)" : "Password"} type="password" style={{ width: '100%', padding: 8 }} required={!editId} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <select name="role" value={form.role} onChange={handleFormChange} style={{ width: '100%', padding: 8 }} required>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <select name="division" value={form.division} onChange={handleFormChange} style={{ width: '100%', padding: 8 }}>
                <option value="">Select Division</option>
                {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <select name="mentor" value={form.mentor} onChange={handleFormChange} style={{ width: '100%', padding: 8 }}>
                <option value="">Select Mentor</option>
                {mentors.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
              </select>
            </div>
            {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ marginRight: 8 }}>Cancel</button>
              <button type="submit">{editId ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users; 