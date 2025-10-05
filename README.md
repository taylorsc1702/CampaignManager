# Campaign Manager - Shopify App

A full-stack Shopify app built with Next.js and Supabase that lets merchants create and track QR codes and permalinks linking directly to variant-specific Shopify carts or checkouts.

## 🚀 Features

- **OAuth Installation**: Seamless Shopify app installation with proper authentication
- **Link & QR Code Generator**: Create short links and QR codes for products with automatic discount codes
- **Dynamic Redirects**: Smart redirects that log scans and apply UTM parameters
- **Order Attribution**: Track conversions back to specific campaigns and links
- **Analytics Dashboard**: Comprehensive analytics with conversion tracking and revenue attribution
- **UTM Parameter Support**: Full UTM parameter tracking for marketing campaigns
- **Shopify Polaris UI**: Native Shopify admin interface experience

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + Shopify Polaris + App Bridge
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Shopify OAuth 2.0
- **QR Code Generation**: qrcode npm package
- **Hosting**: Vercel (recommended)

## 📋 Prerequisites

1. **Shopify Partner Account**: Create a Shopify Partner account at [partners.shopify.com](https://partners.shopify.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **Node.js**: Version 18 or higher
4. **pnpm**: Package manager (recommended)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <your-repo-url>
cd campaign-manager
pnpm install
\`\`\`

### 2. Environment Configuration

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_discounts,read_orders
SHOPIFY_APP_URL=http://localhost:3000
SHOPIFY_REDIRECT_URL=http://localhost:3000/api/auth/callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_DOMAIN=go.yourapp.com
NEXT_PUBLIC_SHOPIFY_API_KEY=your_shopify_api_key
\`\`\`

### 3. Shopify App Setup

1. Go to your [Shopify Partners dashboard](https://partners.shopify.com)
2. Create a new app
3. Configure the following URLs:
   - **App URL**: \`https://your-domain.com/app\`
   - **Allowed redirection URLs**: \`https://your-domain.com/api/auth/callback\`
   - **Webhook URL**: \`https://your-domain.com/api/webhooks/orders-create\`
4. Copy the API key and secret to your environment variables

### 4. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from \`supabase/schema.sql\` in the SQL editor
3. Copy the project URL and API keys to your environment variables
4. Enable Row Level Security (RLS) is already configured in the schema

### 5. Database Schema

The app uses the following main tables:

- **merchants**: Store Shopify shop information and access tokens
- **campaigns**: Organize links into marketing campaigns
- **links**: Individual QR codes and short links
- **scans**: Track every link click/scan with analytics data
- **orders**: Store order attribution data from Shopify webhooks

### 6. Development Server

\`\`\`bash
pnpm dev
\`\`\`

The app will be available at \`http://localhost:3000\`

## 📱 App Structure

\`\`\`
src/
├── app/
│   ├── api/
│   │   ├── auth/          # OAuth flow
│   │   ├── short/         # Dynamic redirects
│   │   └── webhooks/      # Shopify webhooks
│   ├── app/               # Main app pages
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── campaigns/     # Campaign management
│   │   ├── links/         # Link management
│   │   └── settings/      # App settings
│   └── layout.tsx         # Root layout
├── components/
│   ├── Dashboard.tsx      # Main dashboard
│   ├── LinkCreator.tsx    # Link creation modal
│   └── Navigation.tsx     # App navigation
└── lib/
    ├── supabase.ts        # Database client
    ├── shopify.ts         # Shopify API utilities
    └── qrcode.ts          # QR code generation
\`\`\`

## 🔄 How It Works

### 1. Link Creation
- Merchant selects a product and variant
- Optional discount code is created via Shopify Admin API
- Short link and QR code are generated
- Link is stored in Supabase with UTM parameters

### 2. Link Tracking
- Customer scans QR code or clicks link
- \`/api/short/[code]\` route logs the scan
- Customer is redirected to Shopify cart with discount and UTM parameters

### 3. Order Attribution
- Shopify sends order webhook to \`/api/webhooks/orders-create\`
- Webhook verifies HMAC signature
- Order is linked back to original campaign/link
- Conversion data is stored for analytics

### 4. Analytics
- Dashboard shows scans, orders, conversion rates
- Revenue attribution by campaign
- Top performing links and campaigns

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Update your environment variables with production URLs:

\`\`\`env
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_REDIRECT_URL=https://your-app.vercel.app/api/auth/callback
NEXT_PUBLIC_APP_DOMAIN=go.yourapp.com
\`\`\`

### Shopify App Configuration

Update your Shopify app URLs to point to production:

- **App URL**: \`https://your-app.vercel.app/app\`
- **Allowed redirection URLs**: \`https://your-app.vercel.app/api/auth/callback\`
- **Webhook URL**: \`https://your-app.vercel.app/api/webhooks/orders-create\`

## 📊 Usage

### Creating Links

1. Install the app in a Shopify store
2. Navigate to the app in the Shopify admin
3. Click "Create Link" on the dashboard
4. Select product and variant
5. Configure discount codes and UTM parameters
6. Generate QR code and short link

### Tracking Campaigns

1. Create campaigns in the "Campaigns" section
2. Assign links to campaigns for better organization
3. View analytics in the "Analytics" section
4. Monitor conversion rates and revenue attribution

## 🔒 Security Features

- **HMAC Verification**: All webhooks are verified using Shopify's HMAC signature
- **Row Level Security**: Database access is restricted per merchant
- **OAuth 2.0**: Secure authentication with Shopify
- **Environment Variables**: Sensitive data is properly secured

## 🛠 Customization

### Adding New Features

1. **New API Routes**: Add to \`src/app/api/\`
2. **New Pages**: Add to \`src/app/app/\`
3. **New Components**: Add to \`src/components/\`
4. **Database Changes**: Update \`supabase/schema.sql\`

### Styling

The app uses Shopify Polaris for consistent Shopify admin UI. Custom styles can be added to \`src/app/globals.css\`.

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.