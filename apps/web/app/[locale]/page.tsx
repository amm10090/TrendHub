import type { NextPage } from 'next';
import { Navbar } from '@/components/navbar';
import { Banner } from '@/components/banner';
import { ProductGrid } from '@/components/product-grid';
import { Footer } from '@/components/footer';
import { useTranslations } from 'next-intl';

const Home: NextPage = () => {
    const t = useTranslations();

    return (
        <main className="min-h-screen">
            <Banner />
            <section className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6 text-[#1A1A1A]">{t('nav.newArrivals')}</h2>
                <ProductGrid />
            </section>
            <section className="container mx-auto px-4 py-8 bg-[#F5F5F2]">
                <h2 className="text-2xl font-bold mb-6 text-[#1A1A1A]">{t('nav.trending')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative aspect-[16/9] bg-[#FAF9F6] rounded-lg shadow-sm border border-[#E8E6E3]">
                        <h3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-[#1A1A1A]">
                            {t('banner.title')}
                        </h3>
                    </div>
                    <div className="relative aspect-[16/9] bg-[#FAF9F6] rounded-lg shadow-sm border border-[#E8E6E3]">
                        <h3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-[#1A1A1A]">
                            {t('banner.description')}
                        </h3>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home; 