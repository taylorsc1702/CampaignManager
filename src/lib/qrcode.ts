import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export async function generateQRCode(
  url: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const,
    ...options
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, defaultOptions)
    return qrCodeDataURL
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeSVG(
  url: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const,
    ...options
  }

  try {
    const qrCodeSVG = await QRCode.toString(url, {
      type: 'svg',
      ...defaultOptions
    })
    return qrCodeSVG
  } catch (error) {
    console.error('Failed to generate QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}

export function buildShortUrl(code: string, domain?: string): string {
  const baseDomain = domain || process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
  return `https://${baseDomain}/api/short/${code}`
}
