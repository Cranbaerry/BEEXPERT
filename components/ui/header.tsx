"use client";

import Image from "next/image";
import React from "react";
import { DialogDemo } from "./demo-dialog";
import { ExitIcon } from "@radix-ui/react-icons";
import { logout } from "@/app/logout/actions";
import { TourNavigation } from "./joyride-header";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  isFixed: boolean;
}

const Header: React.FC<HeaderProps> = ({ isFixed }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItems = () => (
    <>
      <div className="demo__project text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <TourNavigation />
      </div>
      <div className="demo__project text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        <DialogDemo />
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center space-x-4"
        >
          <ExitIcon className="h-4 w-4 mr-2" />
          Logout
        </button>
      </form>
    </>
  );

  return (
    <header
      className={`flex flex-col space-y-2 p-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 bg-white ${
        isFixed ? "fixed top-0 w-full z-50" : ""
      }`}
    >
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center">
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] items-center justify-center mr-2"
            src="/beexpert-logo.svg"
            alt="BEEXPERT Logo"
            width={40}
            height={42.5}
            priority
          />
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert items-center justify-center"
            src="/beexpert-name.svg"
            alt="BEEXPERT"
            width={170}
            height={19}
            priority
          />
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[200px]">
            <nav className="flex flex-col space-y-4">
              <NavItems />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden sm:flex sm:ml-auto sm:w-auto sm:space-x-2 sm:justify-end">
        <nav className="flex items-center space-x-4 lg:space-x-8 mx-6">
          <NavItems />
        </nav>
      </div>
    </header>
  );
};

Header.displayName = "Header";
export { Header };
