"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface JoyrideContextProps {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const JoyrideContext = createContext<JoyrideContextProps | undefined>(
  undefined,
);

export const JoyrideProvider = ({ children }: { children: ReactNode }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <JoyrideContext.Provider value={{ isActive, setIsActive }}>
      {children}
    </JoyrideContext.Provider>
  );
};

export const useJoyride = () => {
  const context = useContext(JoyrideContext);
  if (context === undefined) {
    throw new Error("useJoyride must be used within a JoyrideProvider");
  }
  return context;
};
