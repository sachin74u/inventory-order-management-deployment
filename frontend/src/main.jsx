import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productData, customerData, orderData, summaryData] = await Promise.all([
        api("/products"),
        api("/customers"),
        api("/orders"),
        api("/dashboard"),
      ]);
      setProducts(productData);
      setCustomers(customerData);
      setOrders(orderData);
      setSummary(summaryData);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const refreshAfter = async (message) => {
    await loadData();
    showNotice("success", message);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Boxes size={28} />
          <div>
            <strong>StockPilot</strong>
            <span>Inventory & Orders</span>
          </div>
        </div>
        <nav>
          {[
            ["dashboard", ClipboardList, "Dashboard"],
            ["products", Package, "Products"],
            ["customers", Users, "Customers"],
            ["orders", ShoppingCart, "Orders"],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations Console</p>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          <button className="icon-button" onClick={loadData} title="Refresh data">
            <RefreshCw size={18} />
          </button>
        </header>

        {notice && (
          <div className={`notice ${notice.type}`}>
            {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {notice.text}
          </div>
        )}

        {loading ? (
          <div className="panel">Loading current records...</div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <Dashboard summary={summary} products={products} orders={orders} />
            )}
            {activeTab === "products" && (
              <Products products={products} refreshAfter={refreshAfter} showNotice={showNotice} />
            )}
            {activeTab === "customers" && (
              <Customers customers={customers} refreshAfter={refreshAfter} showNotice={showNotice} />
            )}
            {activeTab === "orders" && (
              <Orders
                orders={orders}
                products={products}
                customers={customers}
                refreshAfter={refreshAfter}
                showNotice={showNotice}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Dashboard({ summary, products, orders }) {
  const lowStock = products.filter((product) => product.quantity_in_stock <= 5);
  return (
    <section className="stack">
      <div className="metric-grid">
        <Metric icon={Package} label="Products" value={summary?.total_products ?? 0} />
        <Metric icon={Users} label="Customers" value={summary?.total_customers ?? 0} />
        <Metric icon={ShoppingCart} label="Orders" value={summary?.total_orders ?? 0} />
        <Metric icon={AlertCircle} label="Low Stock" value={summary?.low_stock_products ?? 0} />
      </div>
      <div className="grid-two">
        <div className="panel">
          <h2>Low Stock Products</h2>
          <SimpleTable
            headers={["SKU", "Name", "Stock"]}
            rows={lowStock.map((p) => [p.sku, p.name, p.quantity_in_stock])}
            empty="No low stock products."
          />
        </div>
        <div className="panel">
          <h2>Recent Orders</h2>
          <SimpleTable
            headers={["Order", "Customer", "Total"]}
            rows={orders.slice(0, 5).map((o) => [`#${o.id}`, o.customer.full_name, money.format(o.total_amount)])}
            empty="No orders yet."
          />
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Products({ products, refreshAfter, showNotice }) {
  const emptyForm = { name: "", sku: "", price: "", quantity_in_stock: "" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantity_in_stock: Number(form.quantity_in_stock),
      };
      await api(editingId ? `/products/${editingId}` : "/products", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setForm(emptyForm);
      setEditingId(null);
      await refreshAfter(editingId ? "Product updated." : "Product created.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const remove = async (id) => {
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      await refreshAfter("Product deleted.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  return (
    <section className="stack">
      <FormPanel title={editingId ? "Update Product" : "Add Product"} onSubmit={submit}>
        <Input label="Product name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
        <Input label="SKU/code" value={form.sku} onChange={(sku) => setForm({ ...form, sku })} required />
        <Input label="Price" type="number" min="0.01" step="0.01" value={form.price} onChange={(price) => setForm({ ...form, price })} required />
        <Input label="Quantity in stock" type="number" min="0" value={form.quantity_in_stock} onChange={(quantity_in_stock) => setForm({ ...form, quantity_in_stock })} required />
      </FormPanel>
      <div className="panel table-panel">
        <h2>Product List</h2>
        <table>
          <thead>
            <tr><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{money.format(product.price)}</td>
                <td>{product.quantity_in_stock}</td>
                <td className="row-actions">
                  <button title="Edit product" onClick={() => { setEditingId(product.id); setForm(product); }}><Save size={16} /></button>
                  <button title="Delete product" onClick={() => remove(product.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Customers({ customers, refreshAfter, showNotice }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api("/customers", { method: "POST", body: JSON.stringify(form) });
      setForm({ full_name: "", email: "", phone: "" });
      await refreshAfter("Customer created.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const remove = async (id) => {
    try {
      await api(`/customers/${id}`, { method: "DELETE" });
      await refreshAfter("Customer deleted.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  return (
    <section className="stack">
      <FormPanel title="Add Customer" onSubmit={submit}>
        <Input label="Full name" value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} required />
        <Input label="Email address" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
        <Input label="Phone number" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required />
      </FormPanel>
      <div className="panel table-panel">
        <h2>Customer List</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th></th></tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.full_name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td className="row-actions">
                  <button title="Delete customer" onClick={() => remove(customer.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Orders({ orders, products, customers, refreshAfter, showNotice }) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const selectedProducts = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_id: Number(customerId),
          items: items.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
          })),
        }),
      });
      setCustomerId("");
      setItems([{ product_id: "", quantity: 1 }]);
      await refreshAfter("Order created and inventory updated.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const remove = async (id) => {
    try {
      await api(`/orders/${id}`, { method: "DELETE" });
      await refreshAfter("Order deleted.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  return (
    <section className="stack">
      <FormPanel title="Create Order" onSubmit={submit}>
        <label className="field">
          <span>Customer</span>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.full_name}</option>
            ))}
          </select>
        </label>
        <div className="order-items">
          {items.map((item, index) => {
            const product = selectedProducts.get(String(item.product_id));
            return (
              <div className="order-item" key={index}>
                <select
                  value={item.product_id}
                  onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, product_id: e.target.value } : row))}
                  required
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name} ({product.quantity_in_stock} available)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max={product?.quantity_in_stock || undefined}
                  value={item.quantity}
                  onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))}
                  required
                />
                <button type="button" title="Remove item" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" className="secondary" onClick={() => setItems([...items, { product_id: "", quantity: 1 }])}>
          <Plus size={16} /> Add item
        </button>
      </FormPanel>
      <div className="panel table-panel">
        <h2>Orders</h2>
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer.full_name}</td>
                <td>{order.items.map((item) => `${item.product.sku} x ${item.quantity}`).join(", ")}</td>
                <td>{money.format(order.total_amount)}</td>
                <td className="row-actions">
                  <button title="Delete order" onClick={() => remove(order.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FormPanel({ title, onSubmit, children }) {
  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      <h2>{title}</h2>
      {children}
      <button className="primary" type="submit"><Save size={16} /> Save</button>
    </form>
  );
}

function Input({ label, value, onChange, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

function SimpleTable({ headers, rows, empty }) {
  return (
    <table>
      <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length}>{empty}</td></tr>
        ) : rows.map((row, index) => (
          <tr key={index}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

createRoot(document.getElementById("root")).render(<App />);
