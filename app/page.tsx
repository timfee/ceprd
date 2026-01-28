import { CopilotSidebar } from "@/components/copilot/chat-interface";
import { Overlay } from "@/components/overlay";
import { PRDEditor } from "@/components/prd/editor";
import { PRDSidebar } from "@/components/prd/sidebar";

export default function Page() {
  console.log("[v0] Page rendering");
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground">
      <div className="relative flex flex-1 overflow-hidden">
        <Overlay />
        <PRDSidebar />

        <div className="min-w-0 flex-1">
          <PRDEditor />
        </div>
      </div>

      <div className="w-80 shrink-0 border-l border-border md:w-96">
        <CopilotSidebar />
      </div>
    </div>
  );
}
