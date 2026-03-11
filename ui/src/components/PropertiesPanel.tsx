import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePanel } from "../context/PanelContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const MIN_WIDTH = 320;
const MAX_WIDTH = 760;
const DEFAULT_WIDTH = 420;

export function PropertiesPanel() {
  const { panelContent, panelVisible, setPanelVisible } = usePanel();
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const resizingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!resizingRef.current) return;
      const next = window.innerWidth - event.clientX;
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next)));
    };

    const onMouseUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!panelContent) return null;

  return (
    <aside
      className="hidden md:flex border-l border-border bg-card flex-col shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-in-out relative"
      style={{ width: panelVisible ? panelWidth : 0, opacity: panelVisible ? 1 : 0 }}
    >
      {panelVisible && (
        <button
          aria-label="Resize properties panel"
          className="absolute left-0 top-0 h-full w-1 -translate-x-1/2 cursor-col-resize bg-transparent hover:bg-border/60"
          onMouseDown={() => {
            resizingRef.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        />
      )}

      <div className="flex-1 flex flex-col min-w-[320px]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium">Properties</span>
          <Button variant="ghost" size="icon-xs" onClick={() => setPanelVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">{panelContent}</div>
        </ScrollArea>
      </div>
    </aside>
  );
}
