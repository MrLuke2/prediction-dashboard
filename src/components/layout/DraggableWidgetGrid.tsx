import React, { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor, 
  DragStartEvent, 
  DragEndEvent, 
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { WidgetShell } from '../widgets/WidgetShell';
import { ResizeHandle } from '../ui/ResizeHandle';
import { Sheet } from '../ui/Sheet';
import { useLayoutStore, useUIStore } from '../../store';
import { WidgetType, LayoutSlots } from '../../store/types';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { WIDGET_REGISTRY } from '../widgets/registry';
import { LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileTab } from '../../store/types';

// --- Internal Helper Components ---

interface SlotWrapperProps {
  slotKey: keyof LayoutSlots;
  children: React.ReactNode;
  isEditMode: boolean;
}

const DroppableSlot: React.FC<SlotWrapperProps> = ({ slotKey, children, isEditMode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: slotKey,
    disabled: !isEditMode
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`h-full relative transition-all duration-300 ${
        isOver && isEditMode ? 'bg-brand-poly-blue/10 ring-2 ring-brand-poly-blue/40 rounded-xl z-20 overflow-hidden' : ''
      }`}
    >
      {isOver && isEditMode && (
         <div className="absolute inset-0 bg-brand-poly-blue/5 animate-pulse pointer-events-none" />
      )}
      {children}
    </div>
  );
};

interface DraggableWidgetWrapperProps {
  slotKey: keyof LayoutSlots;
  widgetType: WidgetType;
  isEditMode: boolean;
}

const DraggableWidgetWrapper: React.FC<DraggableWidgetWrapperProps> = ({ slotKey, widgetType, isEditMode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slotKey,
    data: { widgetType, slotKey },
    disabled: !isEditMode
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <div 
        {...(isEditMode ? listeners : {})} 
        {...(isEditMode ? attributes : {})} 
        tabIndex={isEditMode ? 0 : -1}
        className={`h-full brand-focus-ring rounded-xl ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <WidgetShell widgetType={widgetType} slotKey={slotKey} />
      </div>
    </div>
  );
};

// --- Main Grid Orchestrator ---

interface DraggableWidgetGridProps {
  mobileTab?: MobileTab;
}

export const DraggableWidgetGrid: React.FC<DraggableWidgetGridProps> = ({ mobileTab = 'overview' }) => {
  const { slots, swapWidget } = useLayoutStore();
  const { isEditMode } = useUIStore();
  const [activeId, setActiveId] = useState<keyof LayoutSlots | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as keyof LayoutSlots);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      swapWidget(active.id as keyof LayoutSlots, over.id as keyof LayoutSlots);
    }
    setActiveId(null);
  };

  const renderSlot = (slotKey: keyof LayoutSlots) => {
    return (
      <DroppableSlot slotKey={slotKey} isEditMode={isEditMode}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${slotKey}-${slots[slotKey]}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            <DraggableWidgetWrapper 
              slotKey={slotKey} 
              widgetType={slots[slotKey]} 
              isEditMode={isEditMode} 
            />
          </motion.div>
        </AnimatePresence>
      </DroppableSlot>
    );
  };

  // Mobile View Switcher
  if (isMobile) {
    const mobileWidget = useMemo(() => {
      switch (mobileTab) {
        case 'overview': return renderSlot('left');
        case 'predictions': return renderSlot('centerTopLeft');
        case 'execution': return renderSlot('centerBottomLeft');
        case 'news': return renderSlot('centerTopRight');
        case 'radar': return renderSlot('rightBottom');
        default: return renderSlot('left');
      }
    }, [mobileTab, slots]);

    return (
      <div className="h-full w-full pb-16">
        {mobileWidget}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full w-full relative">
        {/* Tablet Sidebar Trigger */}
        {isTablet && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-2 -left-1 z-30 bg-brand-poly-blue text-white p-2 rounded-r-md shadow-lg brand-focus-ring"
            aria-label="Open sidebar"
          >
            <LayoutGrid size={16} />
          </button>
        )}

        <Sheet 
          isOpen={isSidebarOpen && isTablet} 
          onClose={() => setSidebarOpen(false)}
          title="Module Hub"
          side="left"
        >
          <div className="p-4 h-[600px]">
            {renderSlot('left')}
          </div>
        </Sheet>

        <PanelGroup direction="horizontal" autoSaveId="dashboard-layout-h">
          {/* LEFT COLUMN (Desktop Only) */}
          {isDesktop && (
            <Panel defaultSize={20} minSize={15} order={1}>
              <div id="left-panel-container" className="h-full p-1">
                {renderSlot('left')}
              </div>
            </Panel>
          )}

          {isDesktop && <ResizeHandle vertical />}

          {/* CENTER COLUMN */}
          <Panel defaultSize={isDesktop ? 55 : 70} minSize={30} order={2}>
            <PanelGroup direction="vertical" autoSaveId="dashboard-layout-v-center">
              <Panel defaultSize={35} minSize={20} order={1}>
                <PanelGroup direction="horizontal" autoSaveId="dashboard-layout-h-center-top">
                  <Panel defaultSize={40} minSize={20}>
                    <div id="center-top-left-panel" className="h-full p-1">{renderSlot('centerTopLeft')}</div>
                  </Panel>
                  <ResizeHandle vertical />
                  <Panel defaultSize={60} minSize={20}>
                    <div id="center-top-right-panel" className="h-full p-1">{renderSlot('centerTopRight')}</div>
                  </Panel>
                </PanelGroup>
              </Panel>

              <ResizeHandle />

              <Panel defaultSize={65} minSize={20} order={2}>
                <PanelGroup direction="horizontal" autoSaveId="dashboard-layout-h-center-bottom">
                  <Panel defaultSize={40} minSize={20}>
                    <div id="center-bottom-left-panel" className="h-full p-1">{renderSlot('centerBottomLeft')}</div>
                  </Panel>
                  <ResizeHandle vertical />
                  <Panel defaultSize={60} minSize={20}>
                    <div className="h-full p-1">{renderSlot('centerBottomRight')}</div>
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <ResizeHandle vertical />

          {/* RIGHT COLUMN */}
          <Panel defaultSize={isDesktop ? 25 : 30} minSize={15} order={3}>
            <PanelGroup direction="vertical" autoSaveId="dashboard-layout-v-right">
              <Panel defaultSize={35} minSize={20}>
                <div id="right-top-panel" className="h-full p-1">{renderSlot('rightTop')}</div>
              </Panel>
              <ResizeHandle />
              <Panel defaultSize={65} minSize={20}>
                <div id="right-bottom-panel" className="h-full p-1">{renderSlot('rightBottom')}</div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } },
          }),
        }}>
        {activeId ? (
          <motion.div initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.05, opacity: 1 }} className="w-full h-full pointer-events-none">
            <div className="bg-brand-fin-card border-2 border-brand-poly-blue rounded-xl p-4 shadow-2xl flex items-center space-x-4 backdrop-blur-xl">
              <div className="p-2 bg-brand-poly-blue/20 rounded-lg">
                 {React.createElement(WIDGET_REGISTRY[slots[activeId]].icon, { size: 20, className: "text-brand-poly-blue" })}
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">{WIDGET_REGISTRY[slots[activeId]].defaultTitle}</p>
                <p className="text-[10px] text-zinc-500 font-medium">Relocating Module...</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

