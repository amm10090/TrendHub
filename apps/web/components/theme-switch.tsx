"use client";

import { FC } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { SwitchProps, useSwitch } from "@heroui/react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
}) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();

  const onChange = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  const {
    Component,
    slots,
    isSelected,
    getBaseProps,
    getInputProps,
    getWrapperProps,
  } = useSwitch({
    isSelected: theme === "light" || isSSR,
    "aria-label": `Switch to ${theme === "light" || isSSR ? "dark" : "light"} mode`,
    onChange,
  });

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "relative inline-flex items-center justify-center",
          "w-8 h-8 sm:w-10 sm:h-10",
          "rounded-lg",
          "transition-all duration-200",
          "hover:bg-[#F5F5F2]",
          "active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-opacity-50",
          className,
          classNames?.base,
        ),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div
        {...getWrapperProps()}
        className={slots.wrapper({
          class: clsx(
            [
              "flex items-center justify-center",
              "w-full h-full",
              "text-[#1A1A1A]",
              "transition-transform duration-200",
              "transform",
              isSelected ? "rotate-0" : "rotate-180",
            ],
            classNames?.wrapper,
          ),
        })}
      >
        <div className="relative w-5 h-5 sm:w-6 sm:h-6">
          {!isSelected || isSSR ? (
            <SunFilledIcon
              className="absolute inset-0 w-full h-full transition-opacity duration-200"
            />
          ) : (
            <MoonFilledIcon
              className="absolute inset-0 w-full h-full transition-opacity duration-200"
            />
          )}
        </div>
      </div>
    </Component>
  );
};
