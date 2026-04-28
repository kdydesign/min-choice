import type { ComponentPropsWithoutRef } from "react";

type SvgProps = ComponentPropsWithoutRef<"svg">;

export type AppIconName =
  | "childProfile"
  | "header"
  | "navToday"
  | "navHistory"
  | "navProfile"
  | "navShopping"
  | "delete"
  | "logout"
  | "name"
  | "ageMonths"
  | "birthDate"
  | "allergy"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "calories"
  | "protein"
  | "cookTime"
  | "tip"
  | "weekday"
  | "check";

interface AppIconProps extends Omit<SvgProps, "children"> {
  name: AppIconName;
  size?: number;
  active?: boolean;
}

function BabyIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M10 4.25C10 3.00736 11.0074 2 12.25 2C13.4926 2 14.5 3.00736 14.5 4.25V4.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 21C16.6944 21 20.5 17.1944 20.5 12.5C20.5 7.80558 16.6944 4 12 4C7.30558 4 3.5 7.80558 3.5 12.5C3.5 17.1944 7.30558 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11.25H8.51M15.5 11.25H15.51"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.75 15.25C9.55 16.15 10.7 16.75 12 16.75C13.3 16.75 14.45 16.15 15.25 15.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 10.25C4.82 10.25 4.25 10.82 4.25 11.5C4.25 12.18 4.82 12.75 5.5 12.75M18.5 10.25C19.18 10.25 19.75 10.82 19.75 11.5C19.75 12.18 19.18 12.75 18.5 12.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4.5 10.75L12 4.5L19.5 10.75V19C19.5 19.5523 19.0523 20 18.5 20H14.75V14.25H9.25V20H5.5C4.94772 20 4.5 19.5523 4.5 19V10.75Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7.5 3.75V6M16.5 3.75V6M4.5 9H19.5M6.25 20H17.75C18.7165 20 19.5 19.2165 19.5 18.25V6.75C19.5 5.7835 18.7165 5 17.75 5H6.25C5.2835 5 4.5 5.7835 4.5 6.75V18.25C4.5 19.2165 5.2835 20 6.25 20Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 12.75A3.75 3.75 0 1 0 12 5.25A3.75 3.75 0 0 0 12 12.75Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.75 20C4.75 16.8244 7.99435 14.25 12 14.25C16.0056 14.25 19.25 16.8244 19.25 20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5.5 7.25H18.5M9.25 4.5H14.75M8 7.25V18C8 18.8284 8.67157 19.5 9.5 19.5H14.5C15.3284 19.5 16 18.8284 16 18V7.25"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 10V16M13.5 10V16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M13.5 5H7.75C6.7835 5 6 5.7835 6 6.75V17.25C6 18.2165 6.7835 19 7.75 19H13.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 12H10.25M15.5 9L18.5 12L15.5 15"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SmileIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 10.5H9.01M15 10.5H15.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 14C9.7 14.9 10.77 15.5 12 15.5C13.23 15.5 14.3 14.9 15 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CakeIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7.5 8.75V6.75M12 8.75V5.75M16.5 8.75V6.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 6C7.5 5.44772 7.94772 5 8.5 5C9.05228 5 9.5 5.44772 9.5 6C9.5 6.55228 9.05228 7 8.5 7C7.94772 7 7.5 6.55228 7.5 6ZM11 5C11 4.44772 11.4477 4 12 4C12.5523 4 13 4.44772 13 5C13 5.55228 12.5523 6 12 6C11.4477 6 11 5.55228 11 5ZM15.5 6C15.5 5.44772 15.9477 5 16.5 5C17.0523 5 17.5 5.44772 17.5 6C17.5 6.55228 17.0523 7 16.5 7C15.9477 7 15.5 6.55228 15.5 6Z"
        fill="currentColor"
      />
      <path
        d="M5.5 10.25H18.5V18.5C18.5 19.0523 18.0523 19.5 17.5 19.5H6.5C5.94772 19.5 5.5 19.0523 5.5 18.5V10.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 14.25C6.3 14.85 7.1 15.15 7.9 15.15C9.1 15.15 9.9 14.45 10.5 13.9C11.05 14.45 11.85 15.15 13.05 15.15C14.25 15.15 15.05 14.45 15.6 13.9C16.2 14.45 17 15.15 18.2 15.15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M11.104 4.38C11.48 3.74667 12.52 3.74667 12.896 4.38L20.0314 16.38C20.4182 17.0306 19.9492 17.875 19.1354 17.875H4.86458C4.05079 17.875 3.58176 17.0306 3.96863 16.38L11.104 4.38Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.75V12.5M12 15.375H12.01"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 15.75A3.75 3.75 0 1 0 12 8.25A3.75 3.75 0 0 0 12 15.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.75V5.5M12 18.5V20.25M5.75 12H4M20 12H18.25M17.6569 6.34315L16.4194 7.58065M7.58065 16.4194L6.34315 17.6569M17.6569 17.6569L16.4194 16.4194M7.58065 7.58065L6.34315 6.34315"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LunchIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5.25 13.75C5.25 10.7124 7.71243 8.25 10.75 8.25C12.1468 8.25 13.4219 8.77055 14.3919 9.6278C14.6984 9.52305 15.0272 9.4664 15.3694 9.4664C17.053 9.4664 18.4178 10.8311 18.4178 12.5148C18.4178 12.7298 18.3956 12.9395 18.3533 13.1418C19.1245 13.4677 19.6667 14.2314 19.6667 15.1218C19.6667 16.3085 18.7047 17.2705 17.518 17.2705H8.79167C6.83766 17.2705 5.25 15.6828 5.25 13.7288V13.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 17.25H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M15.7947 3.75305C16.2674 3.68004 16.6468 4.16421 16.4413 4.59609C15.9805 5.56515 15.7222 6.64943 15.7222 7.79405C15.7222 11.9348 19.0792 15.2918 23.22 15.2918C23.4795 15.2918 23.736 15.2786 23.9886 15.2529C24.4763 15.2033 24.7849 15.7884 24.486 16.1767C22.5069 18.7471 19.3978 20.4062 15.9011 20.4062C9.91638 20.4062 5.06445 15.5542 5.06445 9.5695C5.06445 6.71417 6.16856 4.11798 7.97118 2.17805C8.29161 1.83315 8.85925 2.08609 8.84589 2.55713C8.84545 2.57347 8.84521 2.58986 8.84521 2.60631C8.84521 6.74707 12.2022 10.1041 16.3429 10.1041C16.7206 10.1041 17.0914 10.0761 17.4537 10.0221C17.9507 9.948 18.2772 10.5542 17.9667 10.9349"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M13.538 3.75C13.538 6.01332 10.3076 7.17979 10.3076 9.75C10.3076 10.7694 10.9452 11.613 11.9999 11.613C13.3671 11.613 14.0384 10.5701 14.0384 9.25C15.8982 10.1237 17.25 12.0005 17.25 14.1912C17.25 17.1838 14.9215 19.5 12.0001 19.5C9.07862 19.5 6.75 17.1838 6.75 14.1912C6.75 11.1612 8.76267 9.2254 10.6515 7.38796C11.936 6.1385 13.038 5.06726 13.538 3.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProteinIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M10.25 9.25C10.25 8.00736 11.2574 7 12.5 7H14.2167C15.4633 7 16.4738 8.01048 16.4738 9.25714C16.4738 10.0653 16.0423 10.8122 15.342 11.2177L14.25 11.85"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.5C8.5 10.9812 9.73122 9.75 11.25 9.75H11.5L13.5 11.75L11.5 13.75H10.75C9.23122 13.75 8 14.9812 8 16.5V17C8 18.1046 8.89543 19 10 19H12.5C13.8807 19 15 17.8807 15 16.5V14.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 11L8.5 13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.75V12L14.75 13.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BulbIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M9.25 17.5H14.75M9.75 20H14.25M10 15.75V14.75C10 13.9487 9.61787 13.2104 9.00331 12.7473C7.78012 11.8255 7 10.36 7 8.75C7 5.85051 9.3505 3.5 12.25 3.5C15.1495 3.5 17.5 5.85051 17.5 8.75C17.5 10.3153 16.8142 11.7204 15.7282 12.6839C15.1494 13.1978 14.75 13.9111 14.75 14.6851V15.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6.75 12.5L10.25 16L17.25 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M10.75 17.5C14.4779 17.5 17.5 14.4779 17.5 10.75C17.5 7.02208 14.4779 4 10.75 4C7.02208 4 4 7.02208 4 10.75C4 14.4779 7.02208 17.5 10.75 17.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.75 15.75L20 20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICON_MAP: Record<AppIconName, (props: SvgProps) => JSX.Element> = {
  childProfile: BabyIcon,
  header: BabyIcon,
  navToday: HomeIcon,
  navHistory: CalendarIcon,
  navProfile: UserIcon,
  navShopping: SearchIcon,
  delete: TrashIcon,
  logout: LogoutIcon,
  name: SmileIcon,
  ageMonths: CalendarIcon,
  birthDate: CakeIcon,
  allergy: WarningIcon,
  breakfast: SunIcon,
  lunch: LunchIcon,
  dinner: MoonIcon,
  calories: FlameIcon,
  protein: ProteinIcon,
  cookTime: ClockIcon,
  tip: BulbIcon,
  weekday: CalendarIcon,
  check: CheckIcon
};

function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function AppIcon({
  name,
  size = 20,
  active = false,
  className,
  ...props
}: AppIconProps) {
  const IconComponent = ICON_MAP[name];

  return (
    <IconComponent
      width={size}
      height={size}
      className={joinClassNames("app-icon", active && "is-active", className)}
      data-active={active || undefined}
      aria-hidden={props["aria-label"] ? undefined : true}
      focusable="false"
      {...props}
    />
  );
}
