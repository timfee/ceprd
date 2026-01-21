import { CopilotSidebar } from "@/components/copilot/chat-interface";
import { PRDEditor } from "@/components/prd/editor";
import { PRDSidebar } from "@/components/prd/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  return (
    <div className="h-screen w-full bg-background text-foreground">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel collapsible defaultSize={20} minSize={15}>
          <PRDSidebar />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <PRDEditor />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel collapsible defaultSize={30} minSize={20}>
          <CopilotSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
