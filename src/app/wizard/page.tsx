import WizardFlow from "@/components/WizardFlow";

export default function WizardPage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex-1 flex items-center justify-center p-4 z-10 w-full">
        <WizardFlow />
      </div>
    </main>
  );
}
