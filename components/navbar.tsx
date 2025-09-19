"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package2,
  Building2,
  Menu,
  X,
  CreditCard,
} from "lucide-react"
import { companyService, Company } from "@/services/company"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/mode-toggle"

// Navigation data
const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    title: "Purchase",
    href: "/purchase",
    icon: ArrowDownToLine,
  },
  {
    title: "Items",
    href: "/items",
    icon: Package2,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [companyName, setCompanyName] = React.useState("Vignaharta Plastics")

  // Load company name on component mount
  React.useEffect(() => {
    const loadCompanyName = async () => {
      try {
        // Test connectivity first
        const isConnected = await companyService.testConnection()
        if (!isConnected) {
          console.log('Backend not reachable, using default company name')
          return
        }
        
        try {
          const response = await companyService.getCompanyDetails()
          if (response.success && response.data?.businessName) {
            setCompanyName(response.data.businessName)
          }
        } catch (error: any) {
          // Handle 404 (no company exists) gracefully
          if (error?.status === 404) {
            console.log('No company exists yet, using default name')
          } else {
            console.log('Error loading company name:', error)
          }
        }
      } catch (error) {
        // Keep default name if company data is not available
        console.log('Company data not available, using default name')
      }
    }

    loadCompanyName()
  }, [])

  // Listen for company changes (when user navigates back to company page)
  React.useEffect(() => {
    const handleStorageChange = () => {
      // Reload company name when storage changes (indicating company was updated/deleted)
      const loadCompanyName = async () => {
        try {
          const response = await companyService.getCompanyDetails()
          if (response.success && response.data?.businessName) {
            setCompanyName(response.data.businessName)
          } else {
            setCompanyName("Vignaharta Plastics")
          }
        } catch (error: any) {
          // Handle 404 (no company exists) gracefully
          if (error?.status === 404) {
            // Use default name
          } else {
            // Keep default name on error
          }
          setCompanyName("Vignaharta Plastics")
        }
      }
      loadCompanyName()
    }

    // Listen for focus events (when user comes back to the tab)
    window.addEventListener('focus', handleStorageChange)
    
    return () => {
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        {/* Logo - Left */}
        <div className="flex items-center">
          <Link href="/company" className="flex items-center space-x-3">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <span className="font-bold text-lg">
              {companyName}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Menu - Center */}
        <div className="hidden lg:flex flex-1 justify-center items-center">
          <NavigationMenu>
            <NavigationMenuList className="space-x-2">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "h-9 px-4 py-2",
                        pathname === item.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Tablet/Mobile Actions */}
        <div className="lg:hidden flex items-center space-x-3">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center">
          <ModeToggle />
        </div>
      </div>

      {/* Tablet/Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-6 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href && "bg-accent text-accent-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
