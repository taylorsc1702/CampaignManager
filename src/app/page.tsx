export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>🎯 Campaign Manager</h1>
      <p style={{ marginBottom: '2rem', textAlign: 'center' }}>
        A Shopify app for tracking QR codes and permalinks with conversion analytics
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <a 
          href="/app?shop=demo-shop.myshopify.com" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          🚀 View App Demo
        </a>
        
        <a 
          href="/app/links?shop=demo-shop.myshopify.com" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#7928ca',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          🔗 Links Page
        </a>
        
        <a 
          href="/app/analytics?shop=demo-shop.myshopify.com" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#f21361',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          📊 Analytics
        </a>
      </div>
      
      <div style={{ 
        marginTop: '3rem', 
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h3>Features Preview:</h3>
        <ul style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>✅ QR Code Generation</li>
          <li>✅ Link Tracking & Analytics</li>
          <li>✅ Order Attribution</li>
          <li>✅ Campaign Management</li>
          <li>✅ Shopify Polaris UI</li>
          <li>✅ Conversion Tracking</li>
        </ul>
      </div>
    </div>
  )
}
