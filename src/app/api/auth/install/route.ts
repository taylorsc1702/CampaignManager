import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get('shop')
  
  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 })
  }

  // Redirect to the app with the shop parameter
  const appUrl = `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'}/app?shop=${shop}`
  
  return NextResponse.redirect(appUrl)
}