import clsx from "clsx";

export const OUTLINE_BUTTON = clsx(
  "inline-flex h-10 w-full items-center justify-center gap-1.5 px-5 whitespace-nowrap",
  "bg-e2e-button-fill type-button-s text-e2e-text-soft inset-ring-[0.5px] inset-ring-e2e-button-stroke",
  "transition-[color,box-shadow] duration-200 motion-reduce:transition-none",
  "hover:text-e2e-text-bright hover:inset-ring-e2e-paper-0",
  "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-e2e-white-60",
);
