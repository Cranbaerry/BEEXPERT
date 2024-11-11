"use client";
import { useJoyride } from "@/contexts/JoyrideContext";

const TourNavigation = () => {
  const { setIsActive } = useJoyride();
  return <button onClick={() => setIsActive(true)}>Tour</button>;
};
TourNavigation.displayName = "TourNavigation";

export { TourNavigation };
