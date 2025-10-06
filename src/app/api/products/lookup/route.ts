import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shop_domain, input } = body

    if (!shop_domain || !input) {
      return NextResponse.json({ error: 'Shop domain and input are required' }, { status: 400 })
    }

    // Get merchant access token
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('access_token, shop_domain')
      .eq('shop_domain', shop_domain)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Extract product handle from various input formats
    let productHandle = ''
    let isFullURL = false

    if (input.startsWith('http')) {
      // Full URL input
      try {
        const url = new URL(input)
        const pathParts = url.pathname.split('/')
        const productIndex = pathParts.indexOf('products')
        
        if (productIndex !== -1 && pathParts[productIndex + 1]) {
          productHandle = pathParts[productIndex + 1]
          isFullURL = true
        } else {
          return NextResponse.json({ error: 'Invalid product URL format' }, { status: 400 })
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
      }
    } else {
      // Direct handle input
      productHandle = input.trim()
    }

    // Fetch product from Shopify API
    const shopifyUrl = `https://${shop_domain}/admin/api/2023-10/products.json?handle=${encodeURIComponent(productHandle)}`
    
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': merchant.access_token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.products || data.products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = data.products[0]

    // Format variants for frontend
    const variants = product.variants.map((variant: any) => ({
      id: variant.id,
      title: variant.title === 'Default Title' ? product.title : `${product.title} - ${variant.title}`,
      price: variant.price,
      sku: variant.sku,
      inventory_quantity: variant.inventory_quantity,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3
    }))

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        images: product.images?.map((img: any) => img.src) || [],
        variants: variants,
        options: product.options || []
      },
      isFullURL,
      extractedHandle: productHandle
    })

  } catch (error) {
    console.error('Product lookup error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch product information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
