'use client'; // Or remove if data fetching is server-side initially

import { useParams } from 'next/navigation'; // Import useParams
import { useTranslations } from 'next-intl';

import { Banner } from '@/components/banner'; // Assuming these are general components for the homepage
import { FeaturedBrands } from '@/components/featured-brands';
import { IntroductionSection } from '@/components/introduction-section';
import { LiveDealsRefined } from '@/components/live-deals-refined';
import { ProductGridRefined } from '@/components/product-grid-refined';
import { TrendingSection } from '@/components/trending-section';

// You might want to create specific components for Women/Men sections
// For example: import WomenProducts from '@/components/women-products';
// For example: import MenProducts from '@/components/men-products';

export default function CatchAllPage() {
  const paramsHook = useParams();
  const t = useTranslations();

  if (!paramsHook) {
    // Or return a more sophisticated loading component / null
    return <p>Loading page parameters...</p>;
  }

  const locale = paramsHook.locale as string;
  const catchAll = paramsHook.catchAll as string[] | undefined;

  let pageType = 'home';
  let gender: 'women' | 'men' | undefined = undefined;

  if (catchAll && catchAll.length === 1) {
    if (catchAll[0] === 'women') {
      pageType = 'women';
      gender = 'women';
    } else if (catchAll[0] === 'men') {
      pageType = 'men';
      gender = 'men';
    }
    // Add more specific top-level slugs if needed, e.g., 'brands', 'guides'
    // Or handle them with their own page.tsx files if their layouts are very different.
  }
  // If catchAll has more segments, e.g. /women/dresses, this page.tsx will also catch it
  // if a more specific route like /women/[category]/page.tsx doesn't exist.
  // For now, we focus on /, /women, /men.

  if (pageType === 'home') {
    return (
      <div className="flex flex-col min-h-full">
        {/* Passing locale and other necessary props to Banner and other components might be needed */}
        <Banner />
        <LiveDealsRefined />
        <FeaturedBrands />
        <ProductGridRefined gender={undefined} /> {/* Pass undefined for home */}
        <TrendingSection gender={undefined} /> {/* Pass undefined for home */}
        <IntroductionSection />
      </div>
    );
  }

  if (pageType === 'women' || pageType === 'men') {
    // For women/men pages, render a similar structure to home but pass the gender prop
    return (
      <div className="flex flex-col min-h-full">
        {/* Banner might need to be gender-specific or be a different component */}
        <Banner gender={gender} />
        <LiveDealsRefined gender={gender} />
        <FeaturedBrands gender={gender} />
        <ProductGridRefined gender={gender} />
        <TrendingSection gender={gender} />
        {/* IntroductionSection might also need context or be different */}
        <IntroductionSection gender={gender} />
      </div>
    );
  }

  // Fallback for other paths caught by [[...catchAll]] if not handled above
  // Or if you want to use this page for more general category listings based on catchAll segments
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        {t('genderPage.genericTitle', { locale: locale })}
      </h1>
      <p>Path: /{catchAll ? catchAll.join('/') : ''}</p>
      <p className="mt-4">[Generic Content Placeholder - Check path or implement specific page]</p>
    </div>
  );
}

// Example i18n keys to add (ensure they exist in your en.json/cn.json):
/*
{
  "genderPage": {
    "womenTitle": "Women's Collection",
    "menTitle": "Men's Collection",
    "genericTitle": "Products",
    "showingContentFor": "Showing content for: {gender}"
  }
}
*/
