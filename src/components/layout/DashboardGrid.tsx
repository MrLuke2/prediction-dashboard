import React from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { WidgetShell } from '../widgets/WidgetShell';
import { ResizeHandle } from '../ui/ResizeHandle';
import { useLayoutStore } from '../../store';
import { WidgetType, LayoutSlots } from '../../store/types';

export const DashboardGrid: React.FC = () => {
  const { slots } = useLayoutStore();

  const renderWidget = (widgetType: WidgetType, slotKey: keyof LayoutSlots) => {
    return <WidgetShell widgetType={widgetType} slotKey={slotKey} />;
  };

  return (
    <PanelGroup direction="horizontal" autoSaveId="dashboard-layout-h">
      {/* LEFT COLUMN */}
      <Panel defaultSize={20} minSize={15} order={1}>
        <div id="left-panel-container" className="h-full p-1">
          {renderWidget(slots.left, 'left')}
        </div>
      </Panel>

      <ResizeHandle vertical />

      {/* CENTER COLUMN */}
      <Panel defaultSize={55} minSize={30} order={2}>
        <PanelGroup direction="vertical" autoSaveId="dashboard-layout-v-center">
          {/* Center Top (Split) */}
          <Panel defaultSize={35} minSize={20} order={1}>
            <PanelGroup direction="horizontal" autoSaveId="dashboard-layout-h-center-top">
              <Panel defaultSize={40} minSize={20}>
                <div id="center-top-left-panel" className="h-full p-1">
                  {renderWidget(slots.centerTopLeft, 'centerTopLeft')}
                </div>
              </Panel>
              <ResizeHandle vertical />
              <Panel defaultSize={60} minSize={20}>
                <div id="center-top-right-panel" className="h-full p-1">
                  {renderWidget(slots.centerTopRight, 'centerTopRight')}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <ResizeHandle />

          {/* Center Bottom (Split) */}
          <Panel defaultSize={65} minSize={20} order={2}>
            <PanelGroup direction="horizontal" autoSaveId="dashboard-layout-h-center-bottom">
              <Panel defaultSize={40} minSize={20}>
                <div id="center-bottom-left-panel" className="h-full p-1">
                  {renderWidget(slots.centerBottomLeft, 'centerBottomLeft')}
                </div>
              </Panel>
              <ResizeHandle vertical />
              <Panel defaultSize={60} minSize={20}>
                <div className="h-full p-1">
                  {renderWidget(slots.centerBottomRight, 'centerBottomRight')}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </Panel>

      <ResizeHandle vertical />

      {/* RIGHT COLUMN */}
      <Panel defaultSize={25} minSize={15} order={3}>
        <PanelGroup direction="vertical" autoSaveId="dashboard-layout-v-right">
          <Panel defaultSize={35} minSize={20}>
            <div id="right-top-panel" className="h-full p-1">
              {renderWidget(slots.rightTop, 'rightTop')}
            </div>
          </Panel>
          <ResizeHandle />
          <Panel defaultSize={65} minSize={20}>
            <div id="right-bottom-panel" className="h-full p-1">
              {renderWidget(slots.rightBottom, 'rightBottom')}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
};
