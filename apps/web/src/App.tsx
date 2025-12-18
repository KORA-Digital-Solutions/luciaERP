function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚀 LuciaERP</h1>
      <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
        ERP SaaS Multi-tenant
      </p>
      <p style={{ marginTop: '2rem', opacity: 0.7 }}>
        Belleza • Fisioterapia • Psicología
      </p>
      <div style={{ 
        marginTop: '3rem', 
        padding: '1rem 2rem', 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: '8px',
        backdropFilter: 'blur(10px)'
      }}>
        <code>pnpm dev:api</code> → API en <a href="http://localhost:3001/api/docs" style={{ color: '#ffd700' }}>localhost:3001</a>
      </div>
    </div>
  );
}

export default App;
