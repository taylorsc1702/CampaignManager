import { NextRequest, NextResponse } from 'next/server'
import { generateShopifyAuthUrl } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get('shop')

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 })
  }

  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/
  if (!shopRegex.test(shop)) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 })
  }

  try {
    const authUrl = generateShopifyAuthUrl(shop)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Install error:', error)
    return NextResponse.json({ error: 'Installation failed' }, { status: 500 })
  }
}
