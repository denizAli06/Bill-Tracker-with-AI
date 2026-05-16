import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const C = {
  bg: '#f5f7fa', surface: '#ffffff',
  primary: '#2563eb', text: '#111827',
  muted: '#6b7280', border: '#e5e7eb',
};

// Category color palette
const CAT = {
  electricity: {
    accent: '#f59e0b',       // amber
    bg: '#fffbeb',
    border: '#fde68a',
    badge: '#92400e',
    badgeBg: '#fef3c7',
    label: 'Elektrik',
  },
  water: {
    accent: '#3b82f6',       // blue
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: '#1e3a8a',
    badgeBg: '#dbeafe',
    label: 'Su',
  },
  gas: {
    accent: '#f97316',       // orange
    bg: '#fff7ed',
    border: '#fed7aa',
    badge: '#7c2d12',
    badgeBg: '#ffedd5',
    label: 'Doğalgaz',
  },
  general: {
    accent: '#10b981',       // green
    bg: '#f0fdf4',
    border: '#bbf7d0',
    badge: '#064e3b',
    badgeBg: '#d1fae5',
    label: 'AI Tavsiye',
  },
  ok: {
    accent: '#8b5cf6',       // violet – "all good"
    bg: '#f5f3ff',
    border: '#ddd6fe',
    badge: '#3b0764',
    badgeBg: '#ede9fe',
    label: 'Durum',
  },
};

const CHART_COLORS = {
  electricity: CAT.electricity.accent,
  water: CAT.water.accent,
  gas: CAT.gas.accent,
};

const MONTH_ORDER = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const parseMonthIndex = (label) => {
  const [m, y] = label.split(' ');
  return MONTH_ORDER.indexOf(m) + parseInt(y) * 12;
};
const sortByMonth = (data) => [...data].sort((a, b) => parseMonthIndex(a.month) - parseMonthIndex(b.month));

const SS = {
  // layout
  wrapper: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: 700, color: C.text, margin: 0 },
  headerSub: { fontSize: 13, color: C.muted, margin: '4px 0 0', lineHeight: 1.4 },

  // AI section
  aiSection: {
    background: C.surface, borderRadius: 14,
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
  },
  aiHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
    background: '#fafbfc',
  },
  aiHeaderTitle: { fontSize: 15, fontWeight: 700, color: C.text, margin: 0 },
  aiHeaderSub: { fontSize: 12, color: C.muted, marginLeft: 'auto' },

  // individual insight row
  insightRow: {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '14px 20px',
    borderLeft: '4px solid transparent',
    borderBottom: `1px solid ${C.border}`,
    transition: 'background 0.15s',
  },
  insightNum: {
    minWidth: 22, height: 22, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2,
  },
  insightBody: { flex: 1 },
  insightBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    padding: '2px 8px', borderRadius: 20, marginBottom: 5,
  },
  insightText: { fontSize: 13, color: C.text, lineHeight: 1.65, margin: 0 },

  // stat cards
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  statCard: {
    background: C.surface, borderRadius: 12, padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, marginBottom: 10,
  },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  statValueRow: { display: 'flex', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: 22, fontWeight: 800, color: C.text },
  statUnit: { fontSize: 12, color: C.muted },
  statChange: { fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, marginTop: 6 },

  // chart card
  chartCard: {
    background: C.surface, borderRadius: 12, padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
  },
  chartTitle: { fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 14 },
  legend: { display: 'flex', gap: 16, marginBottom: 14 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted },
  legendDot: { width: 10, height: 10, borderRadius: 3 },

  // bottom grid
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  pieCard: {
    background: C.surface, borderRadius: 12, padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
  },
  pieSectionTitle: { fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 },
  pieLegendItem: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  pieLegendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  pieLegendLabel: { fontSize: 12, color: C.muted, flex: 1 },
  pieLegendValue: { fontSize: 13, fontWeight: 700, color: C.text },
  pieLegendPercent: { fontSize: 11, color: C.muted },
};

function RightPanel({ history, household }) {
  if (!history || history.length === 0) {
    return (
      <div style={SS.chartCard}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Henüz Veri Yok</div>
          <div style={{ fontSize: 12 }}>Fatura ekledikçe burada analizler görünecek.</div>
        </div>
      </div>
    );
  }

  const sorted = sortByMonth(history);
  const count = sorted.length;

  const totalElectricity = sorted.reduce((s, i) => s + i.electricity, 0);
  const totalWater = sorted.reduce((s, i) => s + i.water, 0);
  const totalGas = sorted.reduce((s, i) => s + i.gas, 0);
  const totalAll = totalElectricity + totalWater + totalGas;

  const avgElectricity = count ? totalElectricity / count : 0;
  const avgWater = count ? totalWater / count : 0;
  const avgGas = count ? totalGas / count : 0;
  const avgTotal = avgElectricity + avgWater + avgGas;

  const last = sorted[count - 1];
  const prev = count >= 2 ? sorted[count - 2] : null;

  const calcChange = (cur, pre) => {
    if (!pre) return null;
    const diff = cur - pre;
    const percent = pre ? ((diff / pre) * 100).toFixed(1) : 0;
    return { diff, percent, isIncrease: diff > 0 };
  };

  const elecChange = prev ? calcChange(last.electricity, prev.electricity) : null;
  const waterChange = prev ? calcChange(last.water, prev.water) : null;
  const gasChange = prev ? calcChange(last.gas, prev.gas) : null;

  const savingsPotential = avgElectricity * 0.08 + avgWater * 0.15 + avgGas * 0.07;
  const savingsPercent = avgTotal > 0 ? ((savingsPotential / avgTotal) * 100).toFixed(0) : 0;

  // Build insight items with category info
  const insights = [];
  if (elecChange && elecChange.isIncrease) {
    insights.push({
      cat: CAT.electricity,
      icon: '⚡',
      text: `Elektrik tüketiminiz geçen aya göre %${elecChange.percent} arttı. LED ampullere geçiş yaparak ve gereksiz cihazları fişten çekerek tasarruf edebilirsiniz.`,
    });
  } else if (elecChange && !elecChange.isIncrease) {
    insights.push({
      cat: CAT.electricity,
      icon: '⚡',
      text: `Elektrik tüketiminiz geçen aya göre %${Math.abs(elecChange.percent)} azaldı. Harika gidişat, bu alışkanlıkları sürdürün!`,
    });
  }

  if (waterChange && waterChange.isIncrease) {
    insights.push({
      cat: CAT.water,
      icon: '💧',
      text: `Su kullanımınız geçen aya göre %${waterChange.percent} arttı. Daha kısa duşlar alarak ve muslukları kapatarak %15'e kadar tasarruf edebilirsiniz.`,
    });
  } else if (waterChange && !waterChange.isIncrease) {
    insights.push({
      cat: CAT.water,
      icon: '💧',
      text: `Su kullanımınız geçen aya göre %${Math.abs(waterChange.percent)} azaldı. Sürdürülebilir su kullanımı için teşekkürler!`,
    });
  }

  if (gasChange && gasChange.isIncrease) {
    insights.push({
      cat: CAT.gas,
      icon: '🔥',
      text: `Doğalgaz tüketiminiz geçen aya göre %${gasChange.percent} arttı. Kombi ısısını 1°C düşürerek %7 tasarruf sağlayabilirsiniz.`,
    });
  } else if (gasChange && !gasChange.isIncrease) {
    insights.push({
      cat: CAT.gas,
      icon: '🔥',
      text: `Doğalgaz tüketiminiz geçen aya göre %${Math.abs(gasChange.percent)} azaldı. Enerji verimliliğiniz artıyor!`,
    });
  }

  // Parse backend AI recommendation
  if (last?.ai_recommendation) {
    const lines = last.ai_recommendation
      .split('\n')
      .map(l => l.trim())
      .filter(l => {
        if (l.length < 15) return false;
        if (l.startsWith('|')) return false;
        if (l.startsWith('#')) return false;
        if (l.toLowerCase().includes('mevcut fatura')) return false;
        if (l.toLowerCase().includes('tavsiye') && l.length < 35) return false;
        return true;
      })
      .map(l => l.replace(/^[\d]+\.\s*/, '').replace(/^[-•*]+\s*/, '').replace(/\*\*/g, '').trim());

    lines.forEach(line => {
      if (line.length > 10) insights.push({ cat: CAT.general, icon: '💡', text: line });
    });
  }

  if (insights.length === 0) {
    insights.push({
      cat: CAT.ok,
      icon: '✅',
      text: 'Tüm tüketim değerleriniz normal seviyelerde. Mevcut alışkanlıklarınızı sürdürün!',
    });
  }

  const chartData = sorted.map(item => ({
    month: item.month.split(' ')[0],
    electricity: item.electricity,
    water: item.water,
    gas: item.gas,
  }));

  const pieData = [
    { name: 'Elektrik', value: totalElectricity, color: CHART_COLORS.electricity },
    { name: 'Su', value: totalWater, color: CHART_COLORS.water },
    { name: 'Doğalgaz', value: totalGas, color: CHART_COLORS.gas },
  ];

  return (
    <div style={SS.wrapper}>
      {/* Header */}
      <div style={SS.header}>
        <h3 style={SS.headerTitle}>Genel Bakış</h3>
        <p style={SS.headerSub}>Tüm zamanlara ait tüketim özeti ve tasarruf potansiyelin</p>
      </div>

      {/* ── AI ÖNERİLERİ — EN ÜSTTE ── */}
      <div style={SS.aiSection}>
        <div style={SS.aiHeader}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={SS.aiHeaderTitle}>AI Önerileri</span>
          <span style={SS.aiHeaderSub}>{insights.length} öneri</span>
        </div>

        {insights.map((item, i) => (
          <div
            key={i}
            style={{
              ...SS.insightRow,
              borderLeftColor: item.cat.accent,
              background: item.cat.bg,
              borderBottom: i < insights.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            {/* Numbered circle in category accent color */}
            <div style={{ ...SS.insightNum, background: item.cat.accent, color: '#fff' }}>
              {i + 1}
            </div>

            <div style={SS.insightBody}>
              {/* Category badge */}
              <span style={{
                ...SS.insightBadge,
                background: item.cat.badgeBg,
                color: item.cat.badge,
              }}>
                {item.icon} {item.cat.label.toUpperCase()}
              </span>
              <p style={SS.insightText}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stat Cards ── */}
      <div style={SS.statsGrid}>
        {/* Electricity */}
        <div style={{ ...SS.statCard, borderTop: `3px solid ${CAT.electricity.accent}` }}>
          <div style={{ ...SS.statIcon, background: CAT.electricity.badgeBg, color: CAT.electricity.accent }}>⚡</div>
          <div style={SS.statLabel}>Ortalama Elektrik</div>
          <div style={SS.statValueRow}>
            <span style={SS.statValue}>{avgElectricity.toFixed(0)}</span>
            <span style={SS.statUnit}>TL</span>
          </div>
          {elecChange && (
            <div style={{ ...SS.statChange, color: elecChange.isIncrease ? '#dc2626' : '#16a34a' }}>
              <span>{elecChange.isIncrease ? '↑' : '↓'}</span>
              <span>%{Math.abs(elecChange.percent)} geçen aya göre</span>
            </div>
          )}
        </div>

        {/* Water */}
        <div style={{ ...SS.statCard, borderTop: `3px solid ${CAT.water.accent}` }}>
          <div style={{ ...SS.statIcon, background: CAT.water.badgeBg, color: CAT.water.accent }}>💧</div>
          <div style={SS.statLabel}>Ortalama Su</div>
          <div style={SS.statValueRow}>
            <span style={SS.statValue}>{avgWater.toFixed(0)}</span>
            <span style={SS.statUnit}>TL</span>
          </div>
          {waterChange && (
            <div style={{ ...SS.statChange, color: waterChange.isIncrease ? '#dc2626' : '#16a34a' }}>
              <span>{waterChange.isIncrease ? '↑' : '↓'}</span>
              <span>%{Math.abs(waterChange.percent)} geçen aya göre</span>
            </div>
          )}
        </div>

        {/* Gas */}
        <div style={{ ...SS.statCard, borderTop: `3px solid ${CAT.gas.accent}` }}>
          <div style={{ ...SS.statIcon, background: CAT.gas.badgeBg, color: CAT.gas.accent }}>🔥</div>
          <div style={SS.statLabel}>Ortalama Doğalgaz</div>
          <div style={SS.statValueRow}>
            <span style={SS.statValue}>{avgGas.toFixed(0)}</span>
            <span style={SS.statUnit}>TL</span>
          </div>
          {gasChange && (
            <div style={{ ...SS.statChange, color: gasChange.isIncrease ? '#dc2626' : '#16a34a' }}>
              <span>{gasChange.isIncrease ? '↑' : '↓'}</span>
              <span>%{Math.abs(gasChange.percent)} geçen aya göre</span>
            </div>
          )}
        </div>

        {/* Savings */}
        <div style={{ ...SS.statCard, borderTop: '3px solid #10b981' }}>
          <div style={{ ...SS.statIcon, background: '#d1fae5', color: '#059669' }}>💰</div>
          <div style={SS.statLabel}>Tahmini Tasarruf</div>
          <div style={SS.statValueRow}>
            <span style={SS.statValue}>{savingsPotential.toFixed(0)}</span>
            <span style={SS.statUnit}>TL / ay</span>
          </div>
          <div style={{ ...SS.statChange, color: '#16a34a' }}>
            <span>%{savingsPercent} tasarruf potansiyeli</span>
          </div>
        </div>
      </div>

      {/* ── Trend Chart ── */}
      <div style={SS.chartCard}>
        <div style={SS.chartTitle}>Tüketim Trendleri</div>
        <div style={SS.legend}>
          {[
            { label: 'Elektrik', color: CHART_COLORS.electricity },
            { label: 'Su', color: CHART_COLORS.water },
            { label: 'Doğalgaz', color: CHART_COLORS.gas },
          ].map(item => (
            <div key={item.label} style={SS.legendItem}>
              <div style={{ ...SS.legendDot, background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" fontSize={11} stroke="#6b7280" tickMargin={4} />
            <YAxis fontSize={11} stroke="#6b7280" tickMargin={4} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(value, name) => {
                const labels = { electricity: 'Elektrik', water: 'Su', gas: 'Doğalgaz' };
                return [`${value} TL`, labels[name] || name];
              }}
            />
            <Area type="monotone" dataKey="electricity" stackId="1" stroke={CHART_COLORS.electricity} fill={CHART_COLORS.electricity} fillOpacity={0.55} name="electricity" />
            <Area type="monotone" dataKey="water" stackId="1" stroke={CHART_COLORS.water} fill={CHART_COLORS.water} fillOpacity={0.55} name="water" />
            <Area type="monotone" dataKey="gas" stackId="1" stroke={CHART_COLORS.gas} fill={CHART_COLORS.gas} fillOpacity={0.55} name="gas" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Pie + (empty right slot) ── */}
      <div style={SS.bottomGrid}>
        <div style={SS.pieCard}>
          <div style={SS.pieSectionTitle}>Tüketim Dağılımı</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toFixed(0)} TL`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {pieData.map(entry => {
              const percent = totalAll ? ((entry.value / totalAll) * 100).toFixed(1) : 0;
              return (
                <div key={entry.name} style={SS.pieLegendItem}>
                  <div style={{ ...SS.pieLegendDot, background: entry.color }} />
                  <span style={SS.pieLegendLabel}>{entry.name}</span>
                  <span style={SS.pieLegendValue}>{entry.value.toFixed(0)} TL</span>
                  <span style={SS.pieLegendPercent}>(%{percent})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary text card */}
        <div style={{ ...SS.pieCard, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          <div style={SS.pieSectionTitle}>Özet</div>
          {[
            { color: CAT.electricity.accent, label: 'Toplam Elektrik', val: `${totalElectricity.toFixed(0)} TL` },
            { color: CAT.water.accent, label: 'Toplam Su', val: `${totalWater.toFixed(0)} TL` },
            { color: CAT.gas.accent, label: 'Toplam Doğalgaz', val: `${totalGas.toFixed(0)} TL` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 36, borderRadius: 4, background: row.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{row.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
