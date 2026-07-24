const { useEffect, useMemo, useState } = React;

const BASE_URL = "https://DOTTIE-backend-production.up.railway.app";

const tokenStore = {
  get() {
    return localStorage.getItem("ff_admin_token");
  },
  set(token) {
    localStorage.setItem("ff_admin_token", token);
  },
  clear() {
    localStorage.removeItem("ff_admin_token");
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PageShell = ({ children }) => (
  <div className="min-h-screen">
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
         <h1 className="text-xl font-semibold tracking-tight">DOTTIE.YZ Admin</h1>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <a href="#/dashboard" className="hover:text-white">Dashboard</a>
          <button
            onClick={() => {
              tokenStore.clear();
              window.location.hash = "#/login";
            }}
            className="rounded bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-200"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/api/admin/login", { email, password });
      const token = response.data?.token || response.data?.accessToken;
      if (!token) {
        throw new Error("Token missing from response");
      }
      tokenStore.set(token);
      window.location.hash = "#/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <h2 className="mb-6 text-2xl font-semibold">Admin Login</h2>
        <div className="space-y-4">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
};

const useFetch = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetcher();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, deps);

  return { data, loading, error, reload: run };
};

const ProductsSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/admin/products"), []);
  const [qualityLevels, setQualityLevels] = useState([{ id: 1, name: 'Essential' }, { id: 2, name: 'Premium' }, { id: 3, name: 'Luxe' }]);
  const [form, setForm] = useState({ 
    name: "", 
    sizes: "", 
    images: "", 
    isActive: true,
    quality_prices: []
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    api.get("/api/admin/quality-levels")
      .then(res => { if (res.data?.qualityLevels?.length) setQualityLevels(res.data.qualityLevels); }).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ 
      name: "", 
      sizes: "", 
      images: "", 
      isActive: true,
      quality_prices: []
    });
    setEditingId(null);
  };

  const handleQualityPriceChange = (levelId, price) => {
    const existing = form.quality_prices.filter(qp => qp.quality_level_id !== levelId);
    if (price && parseFloat(price) > 0) {
      existing.push({ quality_level_id: parseInt(levelId), price: parseFloat(price) });
    }
    setForm({ ...form, quality_prices: existing });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const essentialPrice = form.quality_prices.find(qp => qp.quality_level_id === 1)?.price || 0;
    const payload = {
      name: form.name,
      price: essentialPrice,
      sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      image_urls: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
      is_active: form.isActive ? 1 : 0,
      quality_prices: form.quality_prices
    };
    try {
      if (editingId) {
        await api.put(`/api/admin/products/${editingId}`, payload);
        onToast("Product updated");
      } else {
        await api.post("/api/admin/products", payload);
        onToast("Product created");
      }
      resetForm();
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id || product.id);
    const existingPrices = (product.quality_prices || []).map(qp => ({
      quality_level_id: qp.quality_level_id,
      price: qp.price
    }));
    setForm({
      name: product.name || "",
      sizes: (product.sizes || []).join(", "),
      images: (product.image_urls || product.images || []).join(", "),
      isActive: product.isActive !== false && product.is_active !== 0,
      quality_prices: existingPrices
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      onToast("Product deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Delete failed");
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/api/admin/products/${product._id || product.id}`, { is_active: product.is_active ? 0 : 1 });
      reload();
    } catch (err) {
      onToast("Toggle failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Products</h3>
        <button onClick={resetForm} className="text-xs uppercase text-slate-300">Clear</button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Sizes (S, M, L)"
          value={form.sizes}
          onChange={(event) => setForm({ ...form, sizes: event.target.value })}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Images (comma URLs)"
          value={form.images}
          onChange={(event) => setForm({ ...form, images: event.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Active
        </label>
        {qualityLevels.length > 0 && (
          <div className="md:col-span-2 space-y-2 border border-slate-700 rounded-lg p-3 bg-slate-800/50">
            <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Quality Level Prices</p>
            {qualityLevels.map(level => {
              const existingQp = form.quality_prices.find(qp => qp.quality_level_id === level.id);
              return (
                <div key={level.id} className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">{level.name}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-sm"
                    placeholder="Price"
                    value={existingQp?.price || ''}
                    onChange={(event) => handleQualityPriceChange(level.id, event.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data?.products || []).map((product) => (
          <div key={product._id || product.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-400">{Number(product.price).toLocaleString()} FRW</p>
                {(product.quality_prices || []).length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {product.quality_prices.map(qp => `${qp.quality_name}: ${Number(qp.price).toLocaleString()}`).join(' · ')}
                  </p>
                )}
              </div>
              <span className={`text-xs ${product.is_active ? "text-emerald-400" : "text-rose-400"}`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => handleEdit(product)} className="rounded bg-slate-800 px-2 py-1">Edit</button>
              <button onClick={() => toggleActive(product)} className="rounded bg-slate-800 px-2 py-1">
                Toggle
              </button>
              <button onClick={() => handleDelete(product._id || product.id)} className="rounded bg-rose-600 px-2 py-1">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const CollectionsSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/admin/drops"), []);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", status: "upcoming", type: "new-drop" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (data?.drops) console.log("📦 [ADMIN] Fetched drops:", data.drops);
  }, [data]);

  const resetForm = () => {
    setForm({ title: "", description: "", image_url: "", status: "upcoming", type: "new-drop" });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      image_url: form.image_url,
      status: form.status,
      type: form.type
    };
    try {
      if (editingId) {
        await api.put(`/api/admin/drops/${editingId}`, payload);
        onToast("Drop updated");
      } else {
        await api.post("/api/admin/drops", payload);
        onToast("Drop created");
      }
      resetForm();
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save drop");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      description: item.description || "",
      image_url: item.image_url || "",
      status: item.status || "upcoming",
      type: item.type || "new-drop"
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this drop? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/drops/${id}`);
      onToast("Drop deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Delete failed");
    }
  };

  const updateStatus = async (item, newStatus) => {
    try {
      await api.put(`/api/admin/drops/${item.id}`, { status: newStatus });
      onToast(`Status updated to ${newStatus}`);
      reload();
    } catch (err) {
      onToast("Status update failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Drops / Collections Flow</h3>
        <button onClick={resetForm} className="text-xs uppercase text-slate-300">Clear</button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Cover Image URL"
          value={form.image_url}
          onChange={(event) => setForm({ ...form, image_url: event.target.value })}
        />
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
        >
          <option value="closed">Closed (Unavailable)</option>
          <option value="reserve">Reserve (Reserve Now)</option>
          <option value="live">Live (MoMo Enabled)</option>
        </select>
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
        >
          <option value="new-drop">New Arrivals</option>
          <option value="recent-drop">Recent Drops</option>
        </select>
        <textarea
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:col-span-2"
          placeholder="Description"
          rows="2"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 md:col-span-2">
          {editingId ? "Update Drop" : "Add Drop"}
        </button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data?.drops || []).map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-start gap-4">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-12 w-12 rounded object-cover border border-slate-800" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.title}</p>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'reserve' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {item.status || 'closed'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Created: {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => handleEdit(item)} className="rounded bg-slate-800 px-2 py-1">Edit</button>
              <div className="flex gap-1 border-l border-slate-800 pl-2 ml-1">
                <button 
                  onClick={() => updateStatus(item, 'closed')} 
                  className={`rounded px-2 py-1 ${item.status === 'closed' ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-slate-500'}`}
                >Cld</button>
                <button 
                  onClick={() => updateStatus(item, 'reserve')} 
                  className={`rounded px-2 py-1 ${item.status === 'reserve' ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-slate-500'}`}
                >Res</button>
                <button 
                  onClick={() => updateStatus(item, 'live')} 
                  className={`rounded px-2 py-1 ${item.status === 'live' ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-slate-500'}`}
                >Live</button>
              </div>
              <button onClick={() => handleDelete(item.id)} className="ml-auto rounded bg-rose-600/20 text-rose-400 px-2 py-1 hover:bg-rose-600 hover:text-white transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const AnnouncementSection = ({ onToast }) => {
  const { data: announcement, loading, error, reload } = useFetch(() => api.get("/api/admin/announcement"), []);
  const [form, setForm] = useState({
    title: "Movement Update",
    message: "",
    isActive: true
  });

  useEffect(() => {
    if (announcement?.announcement) {
      setForm({
        title: announcement.announcement.title || "Movement Update",
        message: announcement.announcement.message || "",
        isActive: !!announcement.announcement.is_enabled
      });
    }
  }, [announcement]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: form.title,
      message: form.message,
      is_enabled: !!form.isActive
    };
    try {
      const response = await api.put("/api/admin/announcement", payload);
      onToast("Announcement updated");
      
      // If the backend returns the updated announcement, update local form state to confirm
      if (response.data && response.data.announcement) {
        const ann = response.data.announcement;
        setForm({
          title: ann.title || "Movement Update",
          message: ann.message || "",
          isActive: true // Assuming active if saved
        });
      }
      
      reload(); // Trigger background sync
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save announcement");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Announcement Bar</h3>
        <button onClick={reload} className="text-xs uppercase text-slate-300">Refresh</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Display Title</label>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="e.g. New Drop Coming"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Message Content</label>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Message visible to all users"
            rows="3"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Show Announcement Bar
        </label>
        <button className="w-full rounded-lg bg-fof-accent text-white px-3 py-3 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
          Update Live Message
        </button>
      </form>
    </section>
  );
};

const StoreConfigSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/store-config"), []);
  const [form, setForm] = useState({
    store_mode: "upcoming",
    announcement: ""
  });

  useEffect(() => {
    if (data?.config) {
      setForm({
        store_mode: data.config.store_mode || "upcoming",
        announcement: data.config.announcement || ""
      });
    }
  }, [data]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Use the admin store-config endpoint
      await api.put("/api/admin/store-config", form);
      onToast("Store configuration updated");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to update configuration");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="mb-4 text-lg font-semibold">Store Strategy & Mode</h3>
      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {!loading && (
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Shop Mode</label>
              <select
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-white focus:ring-0"
                value={form.store_mode}
                onChange={(e) => setForm({ ...form, store_mode: e.target.value })}
              >
                <option value="closed">Closed (Coming Soon)</option>
                <option value="reserve">Reserve (Reserve Now)</option>
                <option value="live">Live (Pay with MoMo)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Announcement</label>
              <textarea
                rows="1"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-white focus:ring-0"
                placeholder="Banner message..."
                value={form.announcement}
                onChange={(e) => setForm({ ...form, announcement: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
             <button type="submit" className="flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-bold uppercase tracking-widest text-slate-900 hover:bg-slate-200 transition-colors">
               Apply Configuration
             </button>
             <button type="button" onClick={reload} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">
               Reset
             </button>
          </div>
        </form>
      )}
    </section>
  );
};

const OrdersSection = ({ onToast }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => api.get("/api/admin/orders", {
      params: { 
        status: filterStatus, 
        productId: filterProduct,
        startDate,
        endDate
      }
    }), 
    [filterStatus, filterProduct, startDate, endDate]
  );

  const { data: productsData } = useFetch(() => api.get("/api/admin/products"), []);
  const products = productsData?.products || [];
  const orders = data?.orders || [];

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    // Compatibility
    contacted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      onToast(`Order #${orderId} updated to ${newStatus}`);
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to update status");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    contacted: orders.filter((o) => o.status === "contacted").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Orders / Reservations</h3>
        <button onClick={reload} className="rounded bg-slate-800 px-3 py-1 text-xs uppercase text-slate-300 hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 border-b border-slate-800 pb-6 md:grid-cols-4">
        {/* Status Dropdown */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Product Dropdown */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Product</label>
          <select 
            value={filterProduct} 
            onChange={(e) => setFilterProduct(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">From Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">To Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading orders...</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {/* Orders Table */}
      {!loading && filteredOrders.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">No orders found.</p>
      )}
      {!loading && filteredOrders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Size/Qty</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-mono text-xs">#{order.id}</td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium">{order.customer_name || order.user_display_name || "Guest"}</p>
                        <p className="text-xs text-slate-500">{order.customer_email || order.user_display_email || ""}</p>
                        {order.phone_number && (
                          <p className="text-xs text-slate-500">{order.phone_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{order.product_name || `Product #${order.product_id}`}</td>
                    <td className="py-3 pr-4 text-xs text-slate-400">
                      {(order.size || "N/A")} / {order.quantity || 1}
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold">{parseFloat(order.total_price).toLocaleString()} FRW</td>
                    <td className="py-3 pr-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs capitalize">{order.payment_method || "reservation"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || "bg-slate-800 text-slate-400"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{formatDate(order.created_at)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          {expandedId === order.id ? "Hide" : "Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <td colSpan="9" className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Order ID</p>
                            <p className="font-mono">#{order.id}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Product ID</p>
                            <p className="font-mono">#{order.product_id}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Color</p>
                            <p>{order.color || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Drop ID</p>
                            <p className="font-mono">{order.drop_id ? `#${order.drop_id}` : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Created</p>
                            <p>{formatDate(order.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Updated</p>
                            <p>{formatDate(order.updated_at)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">User ID</p>
                            <p className="font-mono">{order.user_id ? `#${order.user_id}` : "Guest"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Payment Method</p>
                            <p className="capitalize">{order.payment_method || "reservation"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const ReservationsSection = ({ onToast }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, loading, error, reload } = useFetch(
    () => api.get("/api/admin/reservations", {
      params: { 
        status: filterStatus,
        productId: filterProduct,
        startDate,
        endDate
      }
    }), 
    [filterStatus, filterProduct, startDate, endDate]
  );
  
  const { data: productsData } = useFetch(() => api.get("/api/admin/products"), []);
  const products = productsData?.products || [];
  const reservations = data?.reservations || [];

  useEffect(() => {
    if (data) {
      console.debug('🔎 Admin reservations payload:', data);
    }
  }, [data]);

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    // Compatibility
    fulfilled: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  const resolveReservationProductImage = (product) => {
    if (!product) return null;
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    if (typeof product.image_urls === 'string' && product.image_urls.trim() !== '') {
      try {
        const parsed = JSON.parse(product.image_urls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {
        return product.image_urls;
      }
    }
    if (typeof product.image_url === 'string' && product.image_url.trim() !== '') {
      return product.image_url;
    }
    return null;
  };

  const getReservationProductName = (reservation) => {
    return (
      reservation.product?.name ||
      reservation.productName ||
      reservation.product?.productName ||
      reservation.product_name ||
      `Product #${reservation.product_id}`
    );
  };

  const getReservationUserName = (reservation) => {
    return (
      reservation.user?.name ||
      reservation.userName ||
      reservation.full_name ||
      (reservation.email ? reservation.email.split('@')[0] : 'Guest')
    );
  };

  const getReservationUserEmail = (reservation) => {
    return reservation.user?.email || reservation.userEmail || reservation.email || 'N/A';
  };

  const getReservationUserPhone = (reservation) => {
    return reservation.user?.phone || reservation.phone || 'N/A';
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/admin/reservations/${id}/status`, { status: newStatus });
      onToast(`Reservation marked as ${newStatus}`);
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;
    try {
      await api.delete(`/api/admin/reservations/${id}`);
      onToast("Reservation deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to delete reservation");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Reservations</h3>
        <button onClick={reload} className="rounded bg-slate-800 px-3 py-1 text-xs uppercase text-slate-300 hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 border-b border-slate-800 pb-6 md:grid-cols-4">
        {/* Status Dropdown */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Product Dropdown */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Product</label>
          <select 
            value={filterProduct} 
            onChange={(e) => setFilterProduct(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">From Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">To Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading reservations...</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {reservations.map((res) => (
          <div key={res.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition-all hover:border-slate-700">
            {/* Product Image */}
            <div className="aspect-square w-full bg-slate-900 overflow-hidden">
                <img 
                    src={resolveReservationProductImage(res.product) || "https://placehold.co/400x400?text=F%3EF"} 
                    alt={getReservationProductName(res)}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
            </div>
            
            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white line-clamp-1">{getReservationProductName(res)}</h4>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest bg-slate-900 border border-slate-800 px-1 rounded">{res.size}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest bg-slate-900 border border-slate-800 px-1 rounded">QTY: {res.quantity}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusColors[res.status]}`}>
                        {res.status}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-tighter ${res.store_mode === 'reserve' ? 'bg-blue-500 text-white' : 'bg-fof-accent text-white'}`}>
                        {res.store_mode || 'live'}
                    </span>
                </div>
              </div>
              
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-slate-300">{getReservationUserName(res)}</p>
                <p className="text-[10px] text-slate-500">{getReservationUserEmail(res)}</p>
                <p className="text-[10px] text-slate-500">{getReservationUserPhone(res)}</p>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <select
                  value={res.status}
                  onChange={(e) => handleStatusChange(res.id, e.target.value)}
                  className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] text-slate-300 focus:border-white transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button 
                  onClick={() => handleDelete(res.id)}
                  className="rounded bg-rose-600/10 p-2 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  title="Delete"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-white font-mono">#{res.id}</p>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && filteredReservations.length === 0 && (
        <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm">No reservations found for this filter.</p>
        </div>
      )}
    </section>
  );
};

const Dashboard = () => {
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <PageShell>
      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {toast}
        </div>
      )}
      <div className="grid gap-6">
        <ReservationsSection onToast={notify} />
        <OrdersSection onToast={notify} />
        <ProductsSection onToast={notify} />
        <CollectionsSection onToast={notify} />
        <AnnouncementSection onToast={notify} />
        <StoreConfigSection onToast={notify} />
      </div>
    </PageShell>
  );
};

const App = () => {
  const [route, setRoute] = useState(window.location.hash || "#/login");
  const token = tokenStore.get();

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/login");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (!token && route !== "#/login") {
    window.location.hash = "#/login";
    return null;
  }

  if (token && (route === "#/login" || route === "#/")) {
    window.location.hash = "#/dashboard";
    return null;
  }

  return route === "#/dashboard" ? <Dashboard /> : <Login />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
