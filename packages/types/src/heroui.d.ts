declare module '@heroui/react' {
    import { ReactNode, ComponentType, HTMLAttributes, FC } from 'react';

    // 基础组件类型
    export interface BaseProps {
        className?: string;
        children?: ReactNode;
    }

    // 按钮组件
    export interface ButtonProps extends BaseProps {
        color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
        variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
        size?: 'sm' | 'md' | 'lg';
        radius?: 'sm' | 'md' | 'lg' | 'full' | 'none';
        isDisabled?: boolean;
        isLoading?: boolean;
        onClick?: () => void;
    }
    export const Button: FC<ButtonProps>;

    // 卡片组件
    export interface CardProps extends BaseProps {
        radius?: 'sm' | 'md' | 'lg' | 'none';
        shadow?: 'sm' | 'md' | 'lg' | 'none';
        isHoverable?: boolean;
        isPressable?: boolean;
        isBlurred?: boolean;
    }
    export const Card: FC<CardProps>;
    export const CardHeader: FC<BaseProps>;
    export const CardBody: FC<BaseProps>;
    export const CardFooter: FC<BaseProps>;

    // 分隔线组件
    export interface DividerProps extends BaseProps {
        orientation?: 'horizontal' | 'vertical';
    }
    export const Divider: FC<DividerProps>;

    // 导航栏组件
    export interface NavbarProps extends BaseProps {
        isBlurred?: boolean;
        position?: 'static' | 'sticky';
    }
    export const Navbar: FC<NavbarProps>;
    export const NavbarBrand: FC<BaseProps>;

    export interface NavbarContentProps extends BaseProps {
        justify?: 'start' | 'center' | 'end';
    }
    export const NavbarContent: FC<NavbarContentProps>;

    // 提供者组件
    export interface HeroUIProviderProps {
        children: ReactNode;
        theme?: object;
    }
    export const HeroUIProvider: FC<HeroUIProviderProps>;
} 