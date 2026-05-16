import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RightPanel from './components/RightPanel';

const API_BASE_URL = 'http://localhost:8000/api';


const ALL_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

// Generate "Ocak 2024", "Şubat 2024" ... in order starting from 2 years ago
function generateMonthOptions(usedMonths = []) {
  const now = new Date();
  const options = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
    for (const m of ALL_MONTHS) {
      const label = `${m} ${y}`;
      options.push({ label, disabled: usedMonths.includes(label) });
    }
  }
  // Only show from the first available month up to current month
  const currentLabel = `${ALL_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const idx = options.findIndex(o => o.label === currentLabel);
  return options.slice(0, idx + 1);
}

/* ─────────────────── COMPONENT ─────────────────── */
function App() {
  const [householdId, setHouseholdId] = useState(() => localStorage.getItem('householdId'));
  const [household, setHousehold] = useState({ household_size: 2, home_type: 'Apartman' });
  const [utilities, setUtilities] = useState({ month: '', electricity: '', water: '', gas: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('add');        // 'add' | 'dashboard' | 'history'
  const [editItem, setEditItem] = useState(null); // { id, electricity, water, gas }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete

  const fetchHousehold = useCallback(async () => {
    try { const r = await axios.get(`${API_BASE_URL}/household/${householdId}`); setHousehold(r.data); }
    catch (e) { console.error(e); }
  }, [householdId]);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/history/${householdId}`);
      setHistory(r.data);
    } catch (e) { console.error(e); }
  }, [householdId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (householdId) { fetchHousehold(); fetchHistory(); }
  }, [householdId, fetchHousehold, fetchHistory]);

  /* Profile */
  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const r = await axios.post(`${API_BASE_URL}/household`, household);
      const id = r.data.id;
      setHouseholdId(id);
      localStorage.setItem('householdId', id);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* Add utility */
  const handleUtilitySubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const r = await axios.post(`${API_BASE_URL}/utilities`, {
        ...utilities,
        household_id: householdId,
        electricity: parseFloat(utilities.electricity),
        water: parseFloat(utilities.water),
        gas: parseFloat(utilities.gas),
      });
      setHistory(prev => [...prev, r.data]);
      setUtilities({ month: '', electricity: '', water: '', gas: '' });
      setView('history');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* Edit utility (only amounts, not month) */
  const handleEditSave = async () => {
    setLoading(true); setError(null);
    try {
      const r = await axios.put(`${API_BASE_URL}/utilities/${editItem.id}`, {
        electricity: parseFloat(editItem.electricity),
        water: parseFloat(editItem.water),
        gas: parseFloat(editItem.gas),
      });
      setHistory(prev => prev.map(h => h.id === editItem.id ? r.data : h));
      setEditItem(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* Delete utility */
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/utilities/${id}`);
      setHistory(prev => prev.filter(h => h.id !== id));
      setDeleteConfirm(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('householdId');
    setHouseholdId(null); setHousehold({ household_size: 2, home_type: 'Apartman' });
    setHistory([]); setEditItem(null); setDeleteConfirm(null);
    setError(null);
  };

  const usedMonths = history.map(h => h.month);
  const monthOptions = generateMonthOptions(usedMonths);
  const lastResult = history.length ? history[history.length - 1] : null;

  /* ── Profile Screen ── */
  if (!householdId) {
    return (
      <div style={S.pageCenter}>
        <div style={S.card}>
          <div style={S.logoRow}>
            <div style={S.logoIcon}>⚡</div>
            <div>
              <div style={S.logoTitle}>EcoTrack AI</div>
              <div style={S.logoSub}>Enerji Takip Asistanı</div>
            </div>
          </div>
          <h2 style={S.heading}>Profilinizi Oluşturun</h2>
          <p style={S.subtext}>Kişiselleştirilmiş AI analizleri için hane bilgilerini girin.</p>
          <form onSubmit={handleProfileSubmit}>
            <label style={S.label}>Hane Halkı Büyüklüğü</label>
            <input
              type="number" min="1"
              value={household.household_size}
              onChange={e => setHousehold({ ...household, household_size: parseInt(e.target.value) })}
              style={S.input} required
            />
            <label style={S.label}>Konut Tipi</label>
            <select
              value={household.home_type}
              onChange={e => setHousehold({ ...household, home_type: e.target.value })}
              style={S.input}
            >
              <option value="Apartman">Apartman Dairesi</option>
              <option value="Müstakil">Müstakil Ev</option>
              <option value="Villa">Villa</option>
            </select>
            {error && <div style={S.error}>{error}</div>}
            <button type="submit" disabled={loading} style={S.btnPrimary}>
              {loading ? 'Kaydediliyor…' : 'Başla →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div style={S.container}>
      {/* Topbar */}
      <header style={S.topbar}>
        <div style={S.topbarLogo}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={S.topbarTitle}>EcoTrack AI</span>
        </div>
        <div style={S.topbarRight}>
          <span style={S.badge}>🏠 {household.home_type} · {household.household_size} kişi</span>
          <button onClick={logout} style={S.btnGhost}>Çıkış</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={S.tabs}>
        <button style={view === 'add' ? S.tabActive : S.tab} onClick={() => { setView('add'); setError(null); }}>
          + Fatura Ekle
        </button>
        <button style={view === 'dashboard' ? S.tabActive : S.tab} onClick={() => { setView('dashboard'); setError(null); }}>
          📊 Genel Bakış {history.length === 0 && <span style={S.tabBadgeMuted}>veri yok</span>}
        </button>
        <button style={view === 'history' ? S.tabActive : S.tab} onClick={() => { setView('history'); setError(null); }}>
          Geçmiş {history.length > 0 && <span style={S.tabBadge}>{history.length}</span>}
        </button>
      </div>

      <main style={S.main}>

        {/* ── Dashboard Tab (full-width) ── */}
        {view === 'dashboard' && (
          <div style={S.dashboardPage}>
            {history.length === 0 ? (
              <div style={S.empty}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: C.text }}>Henüz Veri Yok</div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Dashboard'ı görmek için en az 1 fatura kaydedin.</div>
                <button onClick={() => setView('add')} style={{ ...S.btnPrimary, width: 'auto', padding: '12px 32px', marginTop: 0 }}>
                  + Fatura Ekle
                </button>
              </div>
            ) : (
              <RightPanel history={history} household={household} />
            )}
          </div>
        )}

        {/* ── Add / History Tabs (left column only) ── */}
        {view !== 'dashboard' && (
          <div style={S.singleCol}>
            <div style={S.leftCol}>
            {/* ── Add Form ── */}
            {view === 'add' && (
              <div style={S.card}>
                <h2 style={S.heading}>Aylık Fatura Kaydı</h2>
                <p style={S.subtext}>Ay seçin ve fatura tutarlarını girin, AI anında analiz etsin.</p>

                <form onSubmit={handleUtilitySubmit}>
                  <label style={S.label}>Dönem (Ay)</label>
                  <select
                    value={utilities.month}
                    onChange={e => setUtilities({ ...utilities, month: e.target.value })}
                    style={S.input}
                    required
                  >
                    <option value="">— Ay Seçin —</option>
                    {monthOptions.map(o => (
                      <option key={o.label} value={o.label} disabled={o.disabled}>
                        {o.label}{o.disabled ? ' ✓ (kayıtlı)' : ''}
                      </option>
                    ))}
                  </select>

                  <div style={S.grid3}>
                    <div>
                      <label style={S.label}>⚡ Elektrik (TL)</label>
                      <input type="number" placeholder="0"
                        value={utilities.electricity}
                        onChange={e => setUtilities({ ...utilities, electricity: e.target.value })}
                        style={S.input} required />
                    </div>
                    <div>
                      <label style={S.label}>💧 Su (TL)</label>
                      <input type="number" placeholder="0"
                        value={utilities.water}
                        onChange={e => setUtilities({ ...utilities, water: e.target.value })}
                        style={S.input} required />
                    </div>
                    <div>
                      <label style={S.label}>🔥 Doğalgaz (TL)</label>
                      <input type="number" placeholder="0"
                        value={utilities.gas}
                        onChange={e => setUtilities({ ...utilities, gas: e.target.value })}
                        style={S.input} required />
                    </div>
                  </div>

                  {error && <div style={S.error}>{error}</div>}
                  <button type="submit" disabled={loading} style={S.btnPrimary}>
                    {loading ? '⏳ AI analiz ediyor…' : '🤖 Kaydet ve Analiz Et'}
                  </button>
                </form>
              </div>
            )}

            {/* ── History ── */}
            {view === 'history' && (
              <div>
                <h2 style={{ ...S.heading, marginBottom: 12 }}>Fatura Geçmişi</h2>

                {history.length === 0 ? (
                  <div style={S.empty}>Henüz kayıt yok. Fatura ekleyin.</div>
                ) : (
                  <div style={S.list}>
                    {history.slice().reverse().map(item => {
                      const total = item.electricity + item.water + item.gas;
                      const isEditing = editItem?.id === item.id;
                      const isDeleting = deleteConfirm === item.id;

                      return (
                        <div key={item.id} style={S.listItem}>
                          {/* ── Normal view ── */}
                          {!isEditing && !isDeleting && (
                            <>
                              <div style={S.listLeft}>
                                <div style={S.listMonth}>{item.month}</div>
                                <div style={S.listStats}>
                                  <span>⚡ {item.electricity} TL</span>
                                  <span>💧 {item.water} TL</span>
                                  <span>🔥 {item.gas} TL</span>
                                </div>
                              </div>
                              <div style={S.listRight}>
                                <div style={S.listTotal}>{total.toFixed(0)} TL</div>
                                <div style={S.actionRow}>
                                  <button
                                    onClick={() => setEditItem({ id: item.id, electricity: item.electricity, water: item.water, gas: item.gas })}
                                    style={S.btnEdit}
                                  >
                                    ✏️ Düzenle
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(item.id)}
                                    style={S.btnDel}
                                  >
                                    🗑 Sil
                                  </button>
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── Edit view ── */}
                          {isEditing && (
                            <div style={{ width: '100%' }}>
                              <div style={{ fontWeight: 700, marginBottom: 12, color: C.primary }}>{item.month} — Düzenleniyor</div>
                              <div style={S.grid3}>
                                <div>
                                  <label style={S.label}>⚡ Elektrik (TL)</label>
                                  <input type="number" value={editItem.electricity}
                                    onChange={e => setEditItem({ ...editItem, electricity: e.target.value })}
                                    style={S.input} />
                                </div>
                                <div>
                                  <label style={S.label}>💧 Su (TL)</label>
                                  <input type="number" value={editItem.water}
                                    onChange={e => setEditItem({ ...editItem, water: e.target.value })}
                                    style={S.input} />
                                </div>
                                <div>
                                  <label style={S.label}>🔥 Doğalgaz (TL)</label>
                                  <input type="number" value={editItem.gas}
                                    onChange={e => setEditItem({ ...editItem, gas: e.target.value })}
                                    style={S.input} />
                                </div>
                              </div>
                              {error && <div style={S.error}>{error}</div>}
                              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                                <button onClick={handleEditSave} disabled={loading} style={{ ...S.btnPrimary, marginTop: 0, flex: 1 }}>
                                  {loading ? 'Kaydediliyor…' : '💾 Kaydet'}
                                </button>
                                <button onClick={() => setEditItem(null)} style={{ ...S.btnGhost, flex: 1 }}>
                                  İptal
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ── Delete confirm ── */}
                          {isDeleting && (
                            <div style={{ width: '100%' }}>
                              <div style={{ fontWeight: 700, color: C.errorText, marginBottom: 8 }}>
                                ⚠️ &quot;{item.month}&quot; kaydını silmek istiyor musunuz?
                              </div>
                              <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Bu işlem geri alınamaz.</div>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => handleDelete(item.id)} disabled={loading}
                                  style={{ ...S.btnDel, padding: '10px 0', flex: 1, fontWeight: 700, borderRadius: 8 }}>
                                  {loading ? 'Siliniyor…' : '🗑 Evet, Sil'}
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} style={{ ...S.btnGhost, flex: 1 }}>
                                  İptal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button onClick={() => setView('add')} style={{ ...S.btnPrimary, marginTop: 20 }}>
                  + Yeni Fatura Ekle
                </button>
              </div>
            )}

          </div>
          </div>
        )}

      </main>
    </div>
  );
}

/* ─── STYLES ─── */
const C = {
  bg: '#f5f7fa', surface: '#ffffff',
  primary: '#2563eb', text: '#111827',
  muted: '#6b7280', border: '#e5e7eb',
  error: '#fef2f2', errorText: '#b91c1c',
  ai: '#eff6ff', aiBorder: '#bfdbfe',
};

const S = {
  container: { minHeight: '100vh', background: C.bg, fontFamily: '"Inter", system-ui, sans-serif' },
  page: { minHeight: '100vh', background: C.bg, fontFamily: '"Inter", system-ui, sans-serif' },
  pageCenter: {
    minHeight: '100vh', background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Inter", system-ui, sans-serif', padding: 16,
  },
  card: {
    background: C.surface, borderRadius: 16, padding: '32px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: C.primary, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 22, color: '#fff',
  },
  logoTitle: { fontWeight: 700, fontSize: 18, color: C.text },
  logoSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  heading: { fontSize: 22, fontWeight: 700, color: C.text, margin: '0 0 6px' },
  subtext: { fontSize: 14, color: C.muted, margin: '0 0 20px', lineHeight: 1.5 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6, marginTop: 14 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
    outline: 'none', boxSizing: 'border-box', background: C.surface,
  },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 },
  btnPrimary: {
    marginTop: 24, width: '100%', padding: '12px 0', borderRadius: 10,
    background: C.primary, color: '#fff', fontWeight: 700, fontSize: 15,
    border: 'none', cursor: 'pointer',
  },
  btnGhost: {
    padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
    background: 'transparent', cursor: 'pointer', fontSize: 13, color: C.muted,
  },
  btnEdit: {
    padding: '5px 12px', borderRadius: 6, border: `1px solid #bfdbfe`,
    background: '#eff6ff', color: C.primary, cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  btnDel: {
    padding: '5px 12px', borderRadius: 6, border: `1px solid #fecaca`,
    background: '#fef2f2', color: C.errorText, cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  error: {
    background: C.error, border: `1px solid #fecaca`,
    color: C.errorText, borderRadius: 8, padding: '10px 12px',
    fontSize: 13, marginTop: 12,
  },
  topbar: {
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    padding: '0 24px', height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  topbarLogo: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 17, color: C.text },
  topbarTitle: { fontWeight: 700 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    color: '#166534', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  },
  tabs: {
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    display: 'flex', padding: '0 24px',
  },
  tab: {
    padding: '14px 20px', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 14, color: C.muted, fontWeight: 500,
    borderBottom: '2px solid transparent',
  },
  tabActive: {
    padding: '14px 20px', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 14, color: C.primary, fontWeight: 700,
    borderBottom: `2px solid ${C.primary}`,
  },
  tabBadge: {
    display: 'inline-block', background: C.primary, color: '#fff',
    borderRadius: 20, padding: '1px 7px', fontSize: 11, marginLeft: 6, fontWeight: 700,
  },
  tabBadgeMuted: {
    display: 'inline-block', background: '#e5e7eb', color: C.muted,
    borderRadius: 20, padding: '1px 7px', fontSize: 10, marginLeft: 6, fontWeight: 600,
  },
  main: { margin: '24px 0', padding: '0 32px', minHeight: 'calc(100vh - 120px)' },
  dashboardPage: { width: '100%' },
  singleCol: { maxWidth: 640, margin: '0 auto' },
  leftCol: { minWidth: 0 },
  rightCol: { position: 'sticky', top: 84, maxHeight: 'calc(100vh - 108px)', overflowY: 'auto' },
  aiCard: {
    background: C.ai, border: `1px solid ${C.aiBorder}`,
    borderRadius: 14, padding: '20px 24px', marginBottom: 28,
  },
  aiHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  aiTag: {
    marginLeft: 'auto', fontSize: 11, color: C.muted,
    background: '#dbeafe', borderRadius: 20, padding: '2px 10px', fontWeight: 600,
  },
  aiText: { fontSize: 14, color: '#1e3a5f', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' },
  empty: {
    background: C.surface, borderRadius: 12, padding: '40px 24px',
    textAlign: 'center', color: C.muted, fontSize: 14,
    border: `1px dashed ${C.border}`,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  listItem: {
    background: C.surface, borderRadius: 12, padding: '20px 24px',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: 16,
  },
  listLeft: { flex: 1 },
  listRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  listMonth: { fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 },
  listStats: { display: 'flex', gap: 12, fontSize: 12, color: C.muted },
  listTotal: { fontWeight: 800, fontSize: 18, color: C.primary, whiteSpace: 'nowrap' },
  actionRow: { display: 'flex', gap: 6 },

};

export default App;
