import Image from "next/legacy/image";
import React from "react";
import { DialogDemo } from "./demo-dialog";
import { ExitIcon } from "@radix-ui/react-icons";
import { logout } from "@/app/logout/actions";
interface HeaderProps {
  isFixed: boolean;
}

const Header = ({ isFixed }: HeaderProps) => {
  return (
    <span
      className={`flex flex-col items-start justify-between space-y-2 p-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 bg-white ${isFixed ? "fixed top-0 w-full z-50" : ""
        }`}
    >
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
      <div className="ml-auto flex w-full space-x-2 sm:justify-end">
        <nav
          className="flex items-center space-x-4 lg:space-x-8 mx-6"
        >
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
        </nav>
      </div>
    </span>
  );
};

Header.displayName = "Header";
export { Header };
