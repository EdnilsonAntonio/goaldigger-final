import { Link2 } from "lucide-react";

export default function IntegrationsSection() {
  return (
    <section className="w-full max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-center mb-8">Integrations</h2>
      <div className="flex flex-wrap justify-center gap-8">
        <div className="flex flex-col items-center">
          <Link2 className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-gray-300 text-sm">Google</span>
        </div>
        <div className="flex flex-col items-center">
          <Link2 className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-gray-300 text-sm">Outlook</span>
        </div>
        <div className="flex flex-col items-center">
          <Link2 className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-gray-300 text-sm">Slack</span>
        </div>
        <div className="flex flex-col items-center">
          <Link2 className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-gray-300 text-sm">Zapier</span>
        </div>
        <div className="flex flex-col items-center">
          <Link2 className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-gray-300 text-sm">Notion</span>
        </div>
      </div>
    </section>
  );
} 