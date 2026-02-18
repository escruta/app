import { AccountSection, AppearanceSection } from "@/components/settings";
import { SEOMetadata } from "@/components";

export default function SettingsPage() {
  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title="Settings - Escruta"
        description="Configure your Escruta account settings, appearance preferences, and application behavior."
        url="https://escruta.com/app/settings"
        image="https://escruta.com/OpenGraphImage.webp"
        twitterCard="summary_large_image"
      />
      <div className=" bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 px-4 py-4 md:px-6">
        <div className="flex justify-between items-center gap-2">
          <h1 className="flex items-center gap-1.5 min-w-0 flex-1 *:leading-7 text-gray-900 dark:text-white select-text">
            <span className="truncate text-2xl font-bold">Settings</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 p-3 md:p-4 bg-gray-50 dark:bg-gray-950 overflow-auto">
        <AppearanceSection />
        <AccountSection />
      </div>
    </div>
  );
}
