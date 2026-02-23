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
      <div className="border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-black">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 flex-1 items-center gap-1.5 text-gray-900 select-text *:leading-7 dark:text-white">
            <span className="truncate text-2xl font-bold">Settings</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-3 md:p-4 dark:bg-gray-950">
        <AppearanceSection />
        <AccountSection />
      </div>
    </div>
  );
}
