import React from 'react';
import { Link } from '@heroui/link';
import { Button } from '@heroui/button';
import { HeartIcon } from './icons';

interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    image: string;
}

const products: Product[] = [
    {
        id: '1',
        name: '经典风衣',
        brand: 'Burberry',
        price: 19800,
        image: '/images/products/coat.jpg',
    },
    {
        id: '2',
        name: 'GG Marmont 链条包',
        brand: 'Gucci',
        price: 21500,
        image: '/images/products/bag.jpg',
    },
    {
        id: '3',
        name: '高跟凉鞋',
        brand: 'Jimmy Choo',
        price: 7980,
        image: '/images/products/shoes.jpg',
    },
    {
        id: '4',
        name: '金色贝壳耳环',
        brand: 'Alessandra Rich',
        price: 2980,
        image: '/images/products/earrings.jpg',
    },
];

export const ProductGrid: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <div key={product.id} className="group relative">
                    <div className="aspect-[3/4] bg-[#F5F5F2] rounded-lg overflow-hidden">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover object-center"
                        />
                        <Button
                            isIconOnly
                            variant="light"
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FAF9F6] hover:bg-[#F5F5F2]"
                            aria-label="收藏"
                        >
                            <HeartIcon className="h-5 w-5 text-[#1A1A1A]" />
                        </Button>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-sm text-[#666666]">{product.brand}</h3>
                        <Link href={`/products/${product.id}`} className="block">
                            <p className="mt-1 text-sm font-medium text-[#1A1A1A]">{product.name}</p>
                            <p className="mt-1 text-sm text-[#1A1A1A]">¥{product.price.toLocaleString()}</p>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}; 