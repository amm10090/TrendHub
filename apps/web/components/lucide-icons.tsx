import {
  Heart,
  Search,
  User,
  ShoppingBag,
  Sun,
  Moon,
  Github,
  Twitter,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  ChevronsLeft,
  ChevronsRight,
  LucideProps,
} from 'lucide-react';
import * as React from 'react';

import { IconSvgProps } from '@/types';

// 创建一个适配器函数，将 IconSvgProps 转换为 Lucide 图标需要的属性
function adaptProps(props: IconSvgProps): LucideProps {
  const { size, ...rest } = props;

  return {
    size: size,
    ...rest,
  } as LucideProps;
}

// 导出适配的 Lucide 图标组件
export const LucideHeartIcon: React.FC<IconSvgProps & { filled?: boolean }> = ({
  filled,
  ...props
}) => <Heart {...adaptProps(props)} fill={filled ? 'currentColor' : 'none'} />;

export const LucideSearchIcon: React.FC<IconSvgProps> = (props) => (
  <Search {...adaptProps(props)} />
);

export const LucideUserIcon: React.FC<IconSvgProps> = (props) => <User {...adaptProps(props)} />;

export const LucideShoppingBagIcon: React.FC<IconSvgProps> = (props) => (
  <ShoppingBag {...adaptProps(props)} />
);

export const LucideSunIcon: React.FC<IconSvgProps> = (props) => <Sun {...adaptProps(props)} />;

export const LucideMoonIcon: React.FC<IconSvgProps> = (props) => <Moon {...adaptProps(props)} />;

export const LucideGithubIcon: React.FC<IconSvgProps> = (props) => (
  <Github {...adaptProps(props)} />
);

export const LucideTwitterIcon: React.FC<IconSvgProps> = (props) => (
  <Twitter {...adaptProps(props)} />
);

export const LucideMenuIcon: React.FC<IconSvgProps> = (props) => <Menu {...adaptProps(props)} />;

export const LucideCloseIcon: React.FC<IconSvgProps> = (props) => <X {...adaptProps(props)} />;

export const LucideChevronDownIcon: React.FC<IconSvgProps> = (props) => (
  <ChevronDown {...adaptProps(props)} />
);

export const LucideChevronRightIcon: React.FC<IconSvgProps> = (props) => (
  <ChevronRight {...adaptProps(props)} />
);

export const LucideChevronLeftIcon: React.FC<IconSvgProps> = (props) => (
  <ChevronLeft {...adaptProps(props)} />
);

export const LucidePlusIcon: React.FC<IconSvgProps> = (props) => <Plus {...adaptProps(props)} />;

export const LucideMinusIcon: React.FC<IconSvgProps> = (props) => <Minus {...adaptProps(props)} />;

export const LucideChevronsLeftIcon: React.FC<IconSvgProps> = (props) => (
  <ChevronsLeft {...adaptProps(props)} />
);

export const LucideChevronsRightIcon: React.FC<IconSvgProps> = (props) => (
  <ChevronsRight {...adaptProps(props)} />
);
