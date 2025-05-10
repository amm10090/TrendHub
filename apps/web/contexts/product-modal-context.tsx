'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import { type ProductDetail } from '@/types/product';

import { ProductModal } from '../components/product-detail/product-modal';

interface ProductModalContextType {
  openProductModal: (product: ProductDetail) => void;
  closeProductModal: () => void;
  isModalOpen: boolean;
  selectedProduct: ProductDetail | null;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

export function ProductModalProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 从URL路径中获取当前语言
  const getCurrentLocale = () => {
    if (typeof window === 'undefined') return 'zh';

    return window.location.pathname.split('/')[1] || 'zh';
  };

  const openProductModal = (product: ProductDetail) => {
    if (!mounted) return;
    setSelectedProduct(product);
    setIsModalOpen(true);

    // 在新标签页中打开中转页面
    const currentLocale = getCurrentLocale();

    window.open(`/${currentLocale}/track-redirect/product/${product.id}`, '_blank');
  };

  const closeProductModal = () => {
    if (!mounted) return;
    setIsModalOpen(false);
  };

  const handleOpenInNewTab = () => {
    if (!mounted || !selectedProduct) return;
    const currentLocale = getCurrentLocale();

    window.open(`/${currentLocale}/track-redirect/product/${selectedProduct.id}`, '_blank');
    setIsModalOpen(false);
  };

  const contextValue = {
    openProductModal,
    closeProductModal,
    isModalOpen: mounted ? isModalOpen : false,
    selectedProduct: mounted ? selectedProduct : null,
  };

  return (
    <ProductModalContext.Provider value={contextValue}>
      {children}
      {mounted && selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          product={selectedProduct}
          onClose={closeProductModal}
          onOpenInNewTab={handleOpenInNewTab}
        />
      )}
    </ProductModalContext.Provider>
  );
}

// 自定义Hook便于使用
export function useProductModal() {
  const context = useContext(ProductModalContext);

  if (context === undefined) {
    throw new Error('useProductModal must be used within a ProductModalProvider');
  }

  return context;
}
