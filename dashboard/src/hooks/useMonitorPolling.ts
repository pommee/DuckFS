import { Monitor } from "@/types";
import { useEffect } from "react";

interface Props {
  monitors: Monitor[];
  refreshMonitor: (id: number) => void;
}

export const useMonitorPolling = ({ monitors, refreshMonitor }: Props) => {
  useEffect(() => {
    if (!monitors.length) return;

    const timer = setInterval(() => {
      const now = Date.now();

      monitors.forEach((monitor) => {
        if (monitor.checked === "never") return;

        const lastChecked = new Date(monitor.checked).getTime();
        const elapsed = Math.floor((now - lastChecked) / 1000);

        if (elapsed >= monitor.interval) {
          refreshMonitor(monitor.id);
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [monitors, refreshMonitor]);
};
