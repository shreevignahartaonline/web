# Vignaharta Plastics - Styling Guide

## Overview
This project uses **shadcn/ui** components with **Tailwind CSS v4** for styling. The design system follows shadcn/ui conventions with CSS variables for theming and dark mode support.

## Design System Architecture

### 1. Component Structure
- **Components**: `@/components/ui/` - Reusable UI components
- **Utils**: `@/lib/utils` - Utility functions (cn for className merging)
- **Icons**: **Lucide React** - Icon library
- **Styling**: **Tailwind CSS v4** with CSS variables

### 2. Theming System

#### CSS Variables Approach (Recommended)
- Uses CSS variables for consistent theming
- Enables dynamic theme switching
- Supports light/dark mode seamlessly

#### Available Color Variables
```css
/* Base Colors */
--background: Primary background color
--foreground: Primary text color
--card: Card background
--card-foreground: Card text
--popover: Popover background
--popover-foreground: Popover text

/* Interactive Colors */
--primary: Primary brand color
--primary-foreground: Text on primary
--secondary: Secondary color
--secondary-foreground: Text on secondary
--muted: Muted/subtle backgrounds
--muted-foreground: Muted text
--accent: Accent color
--accent-foreground: Text on accent
--destructive: Error/danger color

/* UI Elements */
--border: Border color
--input: Input field border
--ring: Focus ring color

/* Charts */
--chart-1 to --chart-5: Chart colors

/* Sidebar */
--sidebar: Sidebar background
--sidebar-foreground: Sidebar text
--sidebar-primary: Sidebar primary
--sidebar-accent: Sidebar accent
```

#### Color Convention
- `background` = background color
- `foreground` = text color
- `primary` = main brand color
- `secondary` = secondary brand color
- `muted` = subtle/subdued colors
- `accent` = accent/highlight color
- `destructive` = error/danger color

### 3. Dark Mode Implementation

#### Theme Provider Setup
```jsx
// components/theme-provider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

#### Layout Integration
```jsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4. Available Components

#### Core Components
- **Button**: Primary, secondary, outline, ghost, link variants
- **Input**: Form input fields
- **Card**: Content containers
- **Badge**: Status indicators
- **Avatar**: User profile images
- **Dialog**: Modal dialogs
- **Sheet**: Slide-out panels
- **Dropdown Menu**: Context menus
- **Select**: Dropdown selections
- **Checkbox**: Form checkboxes
- **Radio Group**: Radio button groups
- **Switch**: Toggle switches
- **Slider**: Range inputs
- **Progress**: Progress bars
- **Skeleton**: Loading placeholders
- **Toast**: Notifications
- **Tooltip**: Hover information
- **Popover**: Floating content
- **Alert**: Important messages
- **Tabs**: Tabbed interfaces
- **Table**: Data tables
- **Calendar**: Date picker
- **Command**: Command palette
- **Navigation Menu**: Site navigation
- **Sidebar**: Side navigation
- **Separator**: Visual dividers
- **Scroll Area**: Custom scrollbars
- **Resizable**: Resizable panels
- **Carousel**: Image/content carousels
- **Aspect Ratio**: Maintained aspect ratios
- **Hover Card**: Hover information cards
- **Context Menu**: Right-click menus
- **Menubar**: Application menu bars
- **Breadcrumb**: Navigation breadcrumbs
- **Pagination**: Page navigation
- **Sonner**: Toast notifications
- **Toggle**: Toggle buttons
- **Toggle Group**: Toggle button groups
- **Input OTP**: One-time password inputs
- **Data Table**: Advanced data tables
- **Date Picker**: Date selection
- **Drawer**: Mobile-friendly drawers
- **React Hook Form**: Form handling
- **Typography**: Text styling

### 5. Component Usage Patterns

#### Button Variants
```jsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>
<Button variant="destructive">Delete Action</Button>
```

#### Button Sizes
```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

#### Card Usage
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### 6. Styling Best Practices

#### Class Naming Convention
- Use semantic color classes: `bg-primary`, `text-foreground`
- Use size variants: `h-10`, `px-4`, `py-2`
- Use state classes: `hover:bg-primary/90`, `focus:ring-2`
- Use responsive classes: `sm:text-lg`, `md:p-6`

#### Component Composition
- Use `asChild` prop for flexible composition
- Use `cn()` utility for conditional classes
- Use `forwardRef` for proper ref handling
- Use `VariantProps` for type-safe variants

#### Theme Integration
- Always use CSS variables for colors
- Test both light and dark modes
- Use semantic color names
- Maintain contrast ratios

### 7. Installation Commands

#### Add Components
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add slider
npx shadcn@latest add progress
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add tooltip
npx shadcn@latest add popover
npx shadcn@latest add alert
npx shadcn@latest add tabs
npx shadcn@latest add calendar
npx shadcn@latest add command
npx shadcn@latest add navigation-menu
npx shadcn@latest add sidebar
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add resizable
npx shadcn@latest add carousel
npx shadcn@latest add aspect-ratio
npx shadcn@latest add hover-card
npx shadcn@latest add context-menu
npx shadcn@latest add menubar
npx shadcn@latest add breadcrumb
npx shadcn@latest add pagination
npx shadcn@latest add sonner
npx shadcn@latest add toggle
npx shadcn@latest add toggle-group
npx shadcn@latest add input-otp
npx shadcn@latest add data-table
npx shadcn@latest add date-picker
npx shadcn@latest add drawer
npx shadcn@latest add react-hook-form
npx shadcn@latest add typography
```

#### Install Dependencies
```bash
npm install next-themes
npm install @radix-ui/react-slot
npm install class-variance-authority
npm install clsx
npm install tailwind-merge
npm install lucide-react
```

### 8. Project-Specific Guidelines

#### Brand Colors
- Primary: Use for main actions and branding
- Secondary: Use for secondary actions
- Accent: Use for highlights and emphasis
- Destructive: Use for delete/danger actions

#### Layout Patterns
- Use Card components for content sections
- Use Sheet for mobile navigation
- Use Dialog for modals
- Use Table for data display
- Use Form components for user input

#### Responsive Design
- Mobile-first approach
- Use responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Test on multiple screen sizes
- Use appropriate component variants for mobile

#### Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios
- Use focus indicators

### 9. File Structure
```
vig-web/
├── app/
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx          # Root layout with ThemeProvider
│   └── page.tsx            # Home page
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── theme-provider.tsx  # Theme context provider
│   └── mode-toggle.tsx    # Dark mode toggle
├── lib/
│   └── utils.ts            # Utility functions
└── styling.md              # This styling guide
```

### 10. Quick Reference

#### Common Class Patterns
```css
/* Layout */
flex items-center justify-center
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
container mx-auto px-4

/* Spacing */
p-4 m-2 gap-4 space-y-4
px-6 py-3 mx-auto my-4

/* Colors */
bg-background text-foreground
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground
bg-destructive text-destructive-foreground

/* Borders */
border border-border
rounded-md rounded-lg rounded-xl
border-2 border-dashed

/* States */
hover:bg-primary/90
focus:ring-2 focus:ring-ring
disabled:opacity-50
active:scale-95

/* Responsive */
sm:text-lg md:p-6 lg:grid-cols-3
```

This styling guide should be referenced when designing components and pages for the Vignaharta Plastics project.
