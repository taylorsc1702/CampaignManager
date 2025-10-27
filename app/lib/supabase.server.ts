// Server-only Supabase utilities for React Router
import { supabase } from './supabase'
import type { Session } from '@shopify/shopify-app-react-router'

/**
 * Create or update merchant record in Supabase when Shopify app is installed
 */
export async function upsertMerchantFromSession(session: Session) {
  const { error } = await supabase
    .from('merchants')
    .upsert({
      shop_domain: session.shop,
      access_token: session.accessToken,
      plan: 'starter', // Default plan
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'shop_domain'
    })

  if (error) {
    console.error('Error upserting merchant:', error)
    throw error
  }

  return { shop: session.shop }
}

/**
 * Get merchant record from Supabase by shop domain
 */
export async function getMerchantByShop(shop: string) {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('shop_domain', shop)
    .single()

  if (error) {
    console.error('Error fetching merchant:', error)
    return null
  }

  return data
}

/**
 * Update merchant access token
 */
export async function updateMerchantToken(shop: string, accessToken: string) {
  const { error } = await supabase
    .from('merchants')
    .update({
      access_token: accessToken,
      updated_at: new Date().toISOString()
    })
    .eq('shop_domain', shop)

  if (error) {
    console.error('Error updating merchant token:', error)
    throw error
  }
}

