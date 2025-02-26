import './globals.css';
import { Providers } from './providers';

export const metadata = {
    title: 'TrendHub Admin',
    description: 'TrendHub管理后台',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
} 