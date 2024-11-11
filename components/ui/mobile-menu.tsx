"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TourNavigation } from "./joyride-header";
import { DialogDemo } from "./demo-dialog";
import { logout } from "@/app/logout/actions";

export function MobileMenu() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pr-0">
        <nav className="flex flex-col space-y-4">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <TourNavigation />
          <DialogDemo />
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-sm font-medium transition-colors hover:text-primary"
            >
              Logout
            </Button>
          </form>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
