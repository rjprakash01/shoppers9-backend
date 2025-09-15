import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  category?: string;
  sku?: string;
  gtin?: string;
  mpn?: string;
  condition?: 'new' | 'used' | 'refurbished';
  rating?: {
    value: number;
    count: number;
    bestRating?: number;
    worstRating?: number;
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Shoppers9 - Your Ultimate Shopping Destination',
  description = 'Discover amazing products at unbeatable prices. Shop electronics, fashion, home & garden, and more with fast delivery and excellent customer service.',
  keywords = ['online shopping', 'ecommerce', 'electronics', 'fashion', 'home', 'garden', 'deals'],
  image = '/images/og-default.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  siteName = 'Shoppers9',
  locale = 'en_US',
  price,
  currency = 'INR',
  availability,
  brand,
  category,
  sku,
  gtin,
  mpn,
  condition = 'new',
  rating,
  breadcrumbs,
  noIndex = false,
  noFollow = false,
  canonical
}) => {
  const fullTitle = title.includes('Shoppers9') ? title : `${title} | Shoppers9`;
  const keywordsString = keywords.join(', ');
  const robotsContent = `${noIndex ? 'noindex' : 'index'},${noFollow ? 'nofollow' : 'follow'}`;

  // Generate structured data for products
  const generateProductStructuredData = () => {
    if (type !== 'product') return null;

    const structuredData: any = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: title,
      description: description,
      image: image,
      url: url
    };

    if (brand) structuredData.brand = { '@type': 'Brand', name: brand };
    if (sku) structuredData.sku = sku;
    if (gtin) structuredData.gtin = gtin;
    if (mpn) structuredData.mpn = mpn;
    if (condition) structuredData.itemCondition = `https://schema.org/${condition === 'new' ? 'NewCondition' : condition === 'used' ? 'UsedCondition' : 'RefurbishedCondition'}`;
    if (category) structuredData.category = category;

    if (price && availability) {
      structuredData.offers = {
        '@type': 'Offer',
        price: price,
        priceCurrency: currency,
        availability: `https://schema.org/${availability === 'in stock' ? 'InStock' : availability === 'out of stock' ? 'OutOfStock' : 'PreOrder'}`,
        url: url
      };
    }

    if (rating) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: rating.bestRating || 5,
        worstRating: rating.worstRating || 1
      };
    }

    return JSON.stringify(structuredData);
  };

  // Generate breadcrumb structured data
  const generateBreadcrumbStructuredData = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };

    return JSON.stringify(structuredData);
  };

  // Generate organization structured data
  const generateOrganizationStructuredData = () => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Shoppers9',
      url: 'https://shoppers9.com',
      logo: 'https://shoppers9.com/images/logo.png',
      sameAs: [
        'https://facebook.com/shoppers9',
        'https://twitter.com/shoppers9',
        'https://instagram.com/shoppers9'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-1234567890',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi']
      }
    };

    return JSON.stringify(structuredData);
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="robots" content={robotsContent} />
      {canonical && <link rel="canonical" href={canonical} />}
      {author && <meta name="author" content={author} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@shoppers9" />
      <meta name="twitter:creator" content="@shoppers9" />

      {/* Product-specific Meta Tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={currency} />
          {availability && <meta property="product:availability" content={availability} />}
          {brand && <meta property="product:brand" content={brand} />}
          {category && <meta property="product:category" content={category} />}
          {condition && <meta property="product:condition" content={condition} />}
        </>
      )}

      {/* Mobile and Responsive Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Shoppers9" />

      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#2563eb" />

      {/* Structured Data */}
      {type === 'product' && (
        <script type="application/ld+json">
          {generateProductStructuredData()}
        </script>
      )}
      
      {breadcrumbs && (
        <script type="application/ld+json">
          {generateBreadcrumbStructuredData()}
        </script>
      )}
      
      {type === 'website' && (
        <script type="application/ld+json">
          {generateOrganizationStructuredData()}
        </script>
      )}

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
    </Helmet>
  );
};

export default SEO;

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: 'Shoppers9 - Your Ultimate Shopping Destination',
    description: 'Discover amazing products at unbeatable prices. Shop electronics, fashion, home & garden, and more with fast delivery and excellent customer service.',
    keywords: ['online shopping', 'ecommerce', 'electronics', 'fashion', 'home', 'garden', 'deals', 'india']
  },
  
  products: {
    title: 'Products - Shoppers9',
    description: 'Browse our extensive collection of products across multiple categories. Find exactly what you\'re looking for with our advanced search and filtering options.',
    keywords: ['products', 'online shopping', 'electronics', 'fashion', 'home appliances', 'deals']
  },
  
  cart: {
    title: 'Shopping Cart - Shoppers9',
    description: 'Review your selected items and proceed to checkout. Secure payment options and fast delivery available.',
    keywords: ['shopping cart', 'checkout', 'secure payment', 'online shopping'],
    noIndex: true
  },
  
  checkout: {
    title: 'Checkout - Shoppers9',
    description: 'Complete your purchase with our secure checkout process. Multiple payment options available.',
    keywords: ['checkout', 'secure payment', 'online shopping', 'purchase'],
    noIndex: true
  },
  
  profile: {
    title: 'My Account - Shoppers9',
    description: 'Manage your account, view order history, update preferences, and track your orders.',
    keywords: ['account', 'profile', 'order history', 'user dashboard'],
    noIndex: true
  },
  
  orders: {
    title: 'My Orders - Shoppers9',
    description: 'View and track all your orders. Get real-time updates on delivery status and order history.',
    keywords: ['orders', 'order tracking', 'delivery status', 'purchase history'],
    noIndex: true
  },
  
  support: {
    title: 'Customer Support - Shoppers9',
    description: 'Get help with your orders, returns, and general inquiries. Our customer support team is here to assist you.',
    keywords: ['customer support', 'help', 'contact', 'returns', 'refunds', 'assistance']
  }
};

// Helper function to get SEO config by page name
export const getSEOConfig = (pageName: keyof typeof seoConfigs) => {
  return seoConfigs[pageName] || seoConfigs.home;
};