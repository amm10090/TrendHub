import React from 'react';
import { Link } from '@heroui/link';

const footerLinks = {
    customerService: [
        { name: '联系我们', href: '/contact' },
        { name: '礼品卡购物福利', href: '/gift-cards' },
        { name: '付款方式', href: '/payment' },
        { name: '配送说明', href: '/shipping' },
        { name: '退货与换货', href: '/returns' },
    ],
    aboutUs: [
        { name: '可持续性', href: '/sustainability' },
        { name: '媒体资讯', href: '/press' },
        { name: '工作机会', href: '/careers' },
        { name: '投资者关系', href: '/investors' },
        { name: '联盟计划', href: '/affiliates' },
    ],
    social: [
        { name: 'iOS App', href: '#', qrCode: '/images/qr-ios.png' },
        { name: '华为 App', href: '#', qrCode: '/images/qr-huawei.png' },
        { name: '微信小程序', href: '#', qrCode: '/images/qr-wechat.png' },
    ],
};

export const Footer: React.FC = () => {
    return (
        <footer className="bg-[#FAF9F6] border-t border-[#E8E6E3]">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-6">个性化客户服务</h3>
                        <ul className="space-y-4">
                            {footerLinks.customerService.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-[#666666] hover:text-[#1A1A1A]">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-6">关于我们</h3>
                        <ul className="space-y-4">
                            {footerLinks.aboutUs.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-[#666666] hover:text-[#1A1A1A]">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-6">关注我们</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {footerLinks.social.map((platform) => (
                                <div key={platform.name} className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-2 bg-[#F5F5F2] rounded-lg">
                                        <img
                                            src={platform.qrCode}
                                            alt={`${platform.name} QR Code`}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                    <p className="text-sm text-[#666666]">{platform.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[#E8E6E3]">
                    <div className="text-center text-sm text-[#666666]">
                        <p>copyright © 2004-2024 mytheresa.com</p>
                        <div className="mt-4 space-x-4">
                            <Link href="/terms" className="hover:text-[#1A1A1A]">使用条款</Link>
                            <Link href="/privacy" className="hover:text-[#1A1A1A]">隐私政策</Link>
                            <Link href="/legal" className="hover:text-[#1A1A1A]">法律声明</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}; 