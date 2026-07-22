/**
 * JSON-LD structured data generators for SEO.
 * Helps search engines understand products, organization, and site structure.
 */

interface ProductJsonLd {
  name: string
  description: string
  brand: string
  image?: string
  sku?: string
  price?: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
}

export function productJsonLd(p: ProductJsonLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    brand: { '@type': 'Brand', name: p.brand },
    ...(p.image && { image: p.image }),
    ...(p.sku && { sku: p.sku }),
    ...(p.price && {
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: p.currency || 'KWD',
        availability: `https://schema.org/${p.availability || 'InStock'}`,
      },
    }),
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Last Unique Touch & La Lounge',
    url: 'https://lastuniquetouch.com',
    logo: 'https://lastuniquetouch.com/logo-lut.jpg',
    description:
      'Luxury furniture rental, event planning, and party celebration platform in Kuwait',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KW',
    },
    sameAs: [],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Last Unique Touch & La Lounge',
    url: 'https://lastuniquetouch.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://lastuniquetouch.com/products?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
}
