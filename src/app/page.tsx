export default function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🎉 CampaignLink Successfully Deployed!</h1>
      <p>Your Shopify permalink and QR code management app is now live on Vercel!</p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
        <h3>✅ Deployment Complete</h3>
        <p>Your app is ready for Shopify integration!</p>
        <p><strong>Vercel URL:</strong> https://campaign-manager-firh3zl22-taylors-projects-8356c53c.vercel.app</p>
        <div style={{ marginTop: '1rem' }}>
          <a href="/app" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px',
            marginRight: '10px'
          }}>
            Go to App
          </a>
          <a href="/api/auth/install?shop=demo-shop.myshopify.com" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px'
          }}>
            Install on Shopify
          </a>
        </div>
      </div>
    </div>
  )
}