import type { NextPage } from 'next';
import { Navbar } from '@/components/navbar';
import { Banner } from '@/components/banner';
import { ProductGrid } from '@/components/product-grid';
import { Footer } from '@/components/footer';
import { useTranslations } from 'next-intl';

const Home: NextPage = () => {
    const t = useTranslations();

    return (
        <div className="flex flex-col min-h-full">
            <Banner />
            <section className="w-full flex-1">
                <div className="container">
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-[#1A1A1A]">{t('nav.newArrivals')}</h2>
                    <ProductGrid />
                </div>
            </section>
            <section className="w-full bg-[#F5F5F2] mt-8 sm:mt-12">
                <div className="container py-8 sm:py-12">
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-[#1A1A1A]">{t('nav.trending')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="relative aspect-[16/9] bg-[#FAF9F6] rounded-lg shadow-sm border border-[#E8E6E3] overflow-hidden">
                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1A1A1A] mb-2">
                                    {t('banner.title')}
                                </h3>
                                <p className="text-sm sm:text-base text-[#666666] line-clamp-2 sm:line-clamp-3">
                                    {t('banner.description')}
                                </p>
                            </div>
                        </div>
                        <div className="relative aspect-[16/9] bg-[#FAF9F6] rounded-lg shadow-sm border border-[#E8E6E3] overflow-hidden">
                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1A1A1A] mb-2">
                                    Explore Gucci
                                </h3>
                                <p className="text-sm sm:text-base text-[#666666] line-clamp-2 sm:line-clamp-3">
                                    Spring/Summer 2024 Collection
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home; 