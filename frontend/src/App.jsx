import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE_URL = 'http://localhost:8000/api';

const COLORS = {
  electricity: '#fbbf24',
  water: '#38bdf8',
  gas: '#f87171',
};

const MONTH_ORDER = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const parseMonth = (label) => {
  const [monthName, year] = label.split(' ');
  const monthIndex = MONTH_ORDER.indexOf(monthName);
  return { monthIndex: monthIndex + parseInt(year) * 12, year: parseInt(year), monthName };
};

const sortByMonth = (data) => {
  return [...data].sort((a, b) => parseMonth(a.month).monthIndex - parseMonth(b.month).monthIndex);
};

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
  const [view, setView] = useState('add');        // 'add' | 'history' | 'dashboard'
  const [editItem, setEditItem] = useState(null); // { id, electricity, water, gas }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete
  const [dashboardTab, setDashboardTab] = useState('trends'); // 'trends' | 'compare'
  const [compareType, setCompareType] = useState('monthly'); // 'monthly' | 'yearly'

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
    <div style={S.page}>
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
          📊 Dashboard
        </button>
        <button style={view === 'history' ? S.tabActive : S.tab} onClick={() => { setView('history'); setError(null); }}>
          Geçmiş {history.length > 0 && <span style={S.tabBadge}>{history.length}</span>}
        </button>
      </div>

      <main style={S.main}>

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
            {/* AI card */}
            {lastResult && (
              <div style={S.aiCard}>
                <div style={S.aiHeader}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>AI Tasarruf Tavsiyesi</span>
                  <span style={S.aiTag}>{lastResult.month}</span>
                </div>
                <p style={S.aiText}>{lastResult.ai_recommendation}</p>
              </div>
            )}

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

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <div>
            {history.length < 2 ? (
              <div style={S.empty}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Henüz Yeterli Veri Yok</div>
                <div style={{ fontSize: 14, marginBottom: 16 }}>Grafikler için en az 2 fatura kaydetmelisiniz.</div>
                <button onClick={() => setView('add')} style={{ ...S.btnPrimary, width: 'auto', padding: '10px 24px' }}>
                  + Fatura Ekle
                </button>
              </div>
            ) : (
              <>
                {/* Dashboard Tabs */}
                <div style={S.dashboardTabs}>
                  <button
                    style={dashboardTab === 'trends' ? S.dashboardTabActive : S.dashboardTab}
                    onClick={() => setDashboardTab('trends')}
                  >
                    📈 Trendler
                  </button>
                  <button
                    style={dashboardTab === 'compare' ? S.dashboardTabActive : S.dashboardTab}
                    onClick={() => setDashboardTab('compare')}
                  >
                    ⚖️ Karşılaştırma
                  </button>
                </div>

                {dashboardTab === 'trends' && (
                  <div>
                    {/* Summary Cards */}
                    <div style={S.statsGrid}>
                      {(() => {
                        const sorted = sortByMonth(history);
                        const totalAll = sorted.reduce((sum, item) => sum + item.electricity + item.water + item.gas, 0);
                        const avgMonthly = totalAll / sorted.length;
                        const current = sorted[sorted.length - 1];
                        const previous = sorted[sorted.length - 2];
                        const currentTotal = current.electricity + current.water + current.gas;
                        const previousTotal = previous.electricity + previous.water + previous.gas;
                        const change = currentTotal - previousTotal;
                        const changePercent = previousTotal ? ((change / previousTotal) * 100).toFixed(1) : 0;
                        const isIncrease = change > 0;

                        return (
                          <>
                            <div style={S.statCard}>
                              <div style={S.statIcon}>💰</div>
                              <div style={S.statLabel}>Toplam Harcama</div>
                              <div style={S.statValue}>{totalAll.toFixed(0)} TL</div>
                              <div style={S.statSub}>{sorted.length} ay</div>
                            </div>
                            <div style={S.statCard}>
                              <div style={S.statIcon}>📅</div>
                              <div style={S.statLabel}>Aylık Ortalama</div>
                              <div style={S.statValue}>{avgMonthly.toFixed(0)} TL</div>
                              <div style={S.statSub}>ortalama</div>
                            </div>
                            <div style={S.statCard}>
                              <div style={S.statIcon}>📊</div>
                              <div style={S.statLabel}>Bu Ay</div>
                              <div style={S.statValue}>{currentTotal.toFixed(0)} TL</div>
                              <div style={{ ...S.statSub, color: isIncrease ? C.errorText : '#16a34a' }}>
                                {isIncrease ? '↑' : '↓'} {Math.abs(changePercent)}%
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Trend Chart */}
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>Aylık Tüketim Trendi</div>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={sortByMonth(history).map(item => ({
                          month: item.month.split(' ')[0],
                          total: item.electricity + item.water + item.gas,
                          electricity: item.electricity,
                          water: item.water,
                          gas: item.gas,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" fontSize={12} stroke="#6b7280" />
                          <YAxis fontSize={12} stroke="#6b7280" />
                          <Tooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                            formatter={(value) => [`${value} TL`, '']}
                          />
                          <Area type="monotone" dataKey="total" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} name="Toplam" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category Distribution */}
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>Kategori Dağılımı</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <ResponsiveContainer width="50%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Elektrik', value: history.reduce((s, i) => s + i.electricity, 0) },
                                { name: 'Su', value: history.reduce((s, i) => s + i.water, 0) },
                                { name: 'Doğalgaz', value: history.reduce((s, i) => s + i.gas, 0) },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              <Cell fill={COLORS.electricity} />
                              <Cell fill={COLORS.water} />
                              <Cell fill={COLORS.gas} />
                            </Pie>
                            <Tooltip formatter={(value) => [`${value.toFixed(0)} TL`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                          {[
                            { key: 'electricity', label: '⚡ Elektrik', color: COLORS.electricity },
                            { key: 'water', label: '💧 Su', color: COLORS.water },
                            { key: 'gas', label: '🔥 Doğalgaz', color: COLORS.gas },
                          ].map(cat => {
                            const total = history.reduce((s, i) => s + i[cat.key], 0);
                            const percent = (total / (history.reduce((s, i) => s + i.electricity + i.water + i.gas, 0)) * 100).toFixed(1);
                            return (
                              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: cat.color, marginRight: 8 }} />
                                <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{cat.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{total.toFixed(0)} TL</span>
                                <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>({percent}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dashboardTab === 'compare' && (
                  <div>
                    {/* Compare Type Selector */}
                    <div style={S.compareSelector}>
                      <label style={S.label}>Karşılaştırma Tipi</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => setCompareType('monthly')}
                          style={compareType === 'monthly' ? S.compareBtnActive : S.compareBtn}
                        >
                          📆 Aylık
                        </button>
                        <button
                          onClick={() => setCompareType('yearly')}
                          style={compareType === 'yearly' ? S.compareBtnActive : S.compareBtn}
                        >
                          📅 Yıllık
                        </button>
                      </div>
                    </div>

                    {/* Comparison Result */}
                    {(() => {
                      const sorted = sortByMonth(history);
                      let currentPeriod, previousPeriod;

                      if (compareType === 'monthly') {
                        currentPeriod = sorted[sorted.length - 1];
                        previousPeriod = sorted[sorted.length - 2];
                      } else {
                        const currentYear = parseInt(sorted[sorted.length - 1].month.split(' ')[1]);
                        currentPeriod = sorted.find(i => parseInt(i.month.split(' ')[1]) === currentYear);
                        previousPeriod = sorted.find(i => parseInt(i.month.split(' ')[1]) === currentYear - 1);
                      }

                      if (!currentPeriod || !previousPeriod) {
                        return (
                          <div style={S.empty}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
                            <div>Karşılaştırma için yeterli veri bulunamadı.</div>
                          </div>
                        );
                      }

                      const currentTotal = currentPeriod.electricity + currentPeriod.water + currentPeriod.gas;
                      const previousTotal = previousPeriod.electricity + previousPeriod.water + previousPeriod.gas;
                      const diff = currentTotal - previousTotal;
                      const diffPercent = ((diff / previousTotal) * 100).toFixed(1);
                      const isIncrease = diff > 0;

                      return (
                        <div style={S.compareResult}>
                          <div style={S.compareHeader}>
                            <div>
                              <div style={{ fontSize: 12, color: C.muted }}>Karşılaştırma</div>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{previousPeriod.month} vs {currentPeriod.month}</div>
                            </div>
                            <div style={{ ...S.compareBadge, background: isIncrease ? '#fef2f2' : '#f0fdf4', color: isIncrease ? C.errorText : '#16a34a' }}>
                              {isIncrease ? '↑' : '↓'} {Math.abs(diffPercent)}%
                            </div>
                          </div>

                          <div style={S.compareGrid}>
                            <div style={S.compareItem}>
                              <div style={S.compareLabel}>⚡ Elektrik</div>
                              <div style={S.compareValues}>
                                <div><span style={C.muted}>{previousPeriod.electricity} TL</span></div>
                                <div style={{ fontWeight: 700 }}>{currentPeriod.electricity} TL</div>
                              </div>
                              <div style={{ ...S.compareChange, color: currentPeriod.electricity > previousPeriod.electricity ? C.errorText : '#16a34a' }}>
                                {currentPeriod.electricity > previousPeriod.electricity ? '+' : ''}{(currentPeriod.electricity - previousPeriod.electricity).toFixed(0)} TL
                              </div>
                            </div>
                            <div style={S.compareItem}>
                              <div style={S.compareLabel}>💧 Su</div>
                              <div style={S.compareValues}>
                                <div><span style={C.muted}>{previousPeriod.water} TL</span></div>
                                <div style={{ fontWeight: 700 }}>{currentPeriod.water} TL</div>
                              </div>
                              <div style={{ ...S.compareChange, color: currentPeriod.water > previousPeriod.water ? C.errorText : '#16a34a' }}>
                                {currentPeriod.water > previousPeriod.water ? '+' : ''}{(currentPeriod.water - previousPeriod.water).toFixed(0)} TL
                              </div>
                            </div>
                            <div style={S.compareItem}>
                              <div style={S.compareLabel}>🔥 Doğalgaz</div>
                              <div style={S.compareValues}>
                                <div><span style={C.muted}>{previousPeriod.gas} TL</span></div>
                                <div style={{ fontWeight: 700 }}>{currentPeriod.gas} TL</div>
                              </div>
                              <div style={{ ...S.compareChange, color: currentPeriod.gas > previousPeriod.gas ? C.errorText : '#16a34a' }}>
                                {currentPeriod.gas > previousPeriod.gas ? '+' : ''}{(currentPeriod.gas - previousPeriod.gas).toFixed(0)} TL
                              </div>
                            </div>
                          </div>

                          <div style={S.compareTotal}>
                            <span>Toplam Değişim:</span>
                            <span style={{ fontWeight: 700, color: isIncrease ? C.errorText : '#16a34a' }}>
                              {isIncrease ? '+' : ''}{diff.toFixed(0)} TL ({isIncrease ? 'Artış' : 'Tasarruf'})
                            </span>
                          </div>

                          {isIncrease && (
                            <div style={S.aiCard}>
                              <div style={S.aiHeader}>
                                <span style={{ fontSize: 16 }}>💡</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Tasarruf Önerisi</span>
                              </div>
                              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                                {currentPeriod.month} döneminde {Math.abs(diff).toFixed(0)} TL artış tespit edildi.
                                Geçmiş AI önerilerinizi inceleyerek tasarruf fırsatlarını değerlendirebilirsiniz.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
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
  page: { minHeight: '100vh', background: C.bg, fontFamily: '"Inter", system-ui, sans-serif' },
  pageCenter: {
    minHeight: '100vh', background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Inter", system-ui, sans-serif', padding: 16,
  },
  card: {
    background: C.surface, borderRadius: 16, padding: '32px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 700,
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
  main: { maxWidth: 1200, margin: '32px auto', padding: '0 24px' },
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

  dashboardTabs: { display: 'flex', gap: 8, marginBottom: 20 },
  dashboardTab: {
    padding: '10px 16px', borderRadius: 8, border: 'none',
    background: '#f3f4f6', color: C.muted, cursor: 'pointer', fontSize: 13, fontWeight: 500,
  },
  dashboardTabActive: {
    padding: '10px 16px', borderRadius: 8, border: 'none',
    background: C.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  statCard: {
    background: C.surface, borderRadius: 12, padding: '24px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 10 },
  statLabel: { fontSize: 13, color: C.muted, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 800, color: C.text },
  statSub: { fontSize: 11, color: C.muted, marginTop: 4 },

  chartCard: {
    background: C.surface, borderRadius: 12, padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20,
  },
  chartTitle: { fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20 },

  compareSelector: { marginBottom: 20 },
  compareBtn: {
    padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.surface, color: C.muted, cursor: 'pointer', fontSize: 13,
  },
  compareBtnActive: {
    padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.primary}`,
    background: C.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },

  compareResult: {
    background: C.surface, borderRadius: 14, padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  compareHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
  },
  compareBadge: {
    padding: '6px 14px', borderRadius: 20, fontSize: 14, fontWeight: 700,
  },
  compareGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 },
  compareItem: {
    background: '#f9fafb', borderRadius: 12, padding: 20, textAlign: 'center',
  },
  compareLabel: { fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 },
  compareValues: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 },
  compareChange: { fontSize: 12, fontWeight: 600 },
  compareTotal: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', background: '#f9fafb', borderRadius: 10, fontSize: 14,
  },
};

export default App;
