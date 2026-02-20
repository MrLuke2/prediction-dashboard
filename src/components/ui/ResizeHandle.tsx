import React from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface ResizeHandleProps {
  vertical?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ vertical = false }) => {
  return (
    <PanelResizeHandle className={`
      relative flex items-center justify-center transition-all duration-300 group
      ${vertical ? 'h-full w-2 -mx-1 z-50 cursor-col-resize' : 'w-full h-2 -my-1 z-50 cursor-row-resize'}
    `}>
      <div className={`
        bg-brand-fin-border transition-colors group-hover:bg-brand-poly-blue/50
        ${vertical ? 'w-px h-full group-hover:w-1' : 'h-px w-full group-hover:h-1'}
      `}></div>
      <div className={`absolute bg-brand-fin-card border border-brand-fin-border rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500`}>
        {vertical ? <GripVertical size={10} /> : <GripHorizontal size={10} />}
      </div>
    </PanelResizeHandle>
  );
};
