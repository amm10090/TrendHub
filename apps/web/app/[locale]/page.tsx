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
                <h2 className="text-2xl font-bold mb-6">{t('nav.newArrivals')}</h2>
                <ProductGrid />
            </section>
            <section className="container mx-auto px-4 py-8 bg-gray-50">
                <h2 className="text-2xl font-bold mb-6">{t('nav.sale')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative aspect-[16/9] bg-white rounded-lg shadow-md">
                        <h3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                            {t('banner.title')}
                        </h3>
                    </div>
                    <div className="relative aspect-[16/9] bg-white rounded-lg shadow-md">
                        <h3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                            {t('banner.description')}
                        </h3>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home; 