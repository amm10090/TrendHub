import type { NextPage } from 'next';

import { Banner } from '@/components/banner';
import { IntroductionSection } from '@/components/introduction-section';
import { ProductGrid } from '@/components/product-grid';
import { TrendingSection } from '@/components/trending-section';

const Home: NextPage = () => {
  return (
    <div className="flex flex-col min-h-full">
      <Banner />
      <ProductGrid />
      <TrendingSection />
      <IntroductionSection />
    </div>
  );
};

export default Home;
