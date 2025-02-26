import React from 'react';
import { Button } from '@heroui/button';

export const Banner: React.FC = () => {
    return (
        <div className="relative bg-gray-900 h-[600px] flex items-center">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/images/banner-bg.jpg)',
                    opacity: 0.7
                }}
            />
            <div className="container mx-auto px-4 relative z-10 text-white">
                <div className="max-w-2xl">
                    <h1 className="text-5xl font-bold mb-4">Gucci新季系列</h1>
                    <p className="text-xl mb-8">
                        探索 Gucci 2024 春夏系列，感受意式奢华与现代时尚的完美融合
                    </p>
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-100"
                    >
                        立即探索
                    </Button>
                </div>
            </div>
        </div>
    );
}; 