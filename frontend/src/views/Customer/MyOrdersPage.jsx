import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import CustomerOrders from '../Marketplace/CustomerOrders';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Primary: customer orders endpoint; Fallback: user orders endpoint
      const res = await API.get(`/orders/customer/${user._id}`).catch(() => API.get(`/orders/user/${user._id}`));
      setOrders(res.data || []);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: "rgba(34, 197, 94, 0.1)", padding: "0.8rem", borderRadius: "12px" }}>
          <Package size={28} color="#16a34a" />
        </div>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>My Orders & Subscriptions</h1>
          <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>Manage your past purchases, live tracking, and curated box subscriptions.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <span className="loader" style={{ width: 40, height: 40, borderWidth: 4 }}></span>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <CustomerOrders orders={orders} fetchOrders={fetchOrders} />
        </div>
      )}
    </div>
  );
}
