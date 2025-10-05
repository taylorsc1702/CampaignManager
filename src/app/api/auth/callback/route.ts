import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateShopifyAuthUrl } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state')

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const { access_token } = await tokenResponse.json()

    // Store merchant in Supabase
    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .upsert({
        shop_domain: shop,
        access_token: access_token,
        plan: 'starter'
      }, {
        onConflict: 'shop_domain'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to store merchant: ${error.message}`)
    }

    // Redirect to app with shop parameter
    const appUrl = `${process.env.SHOPIFY_APP_URL}/app?shop=${shop}`
    return NextResponse.redirect(appUrl)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
