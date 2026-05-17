import { AccountSection, AppearanceSection } from "@/components/settings";
import { SEOMetadata, TopBar } from "@/components";

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
      <TopBar title="Settings" />

      <div className="flex-1 overflow-auto bg-gray-50 p-3 md:p-4 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl">
          <AppearanceSection />
          <AccountSection />
        </div>
      </div>
    </div>
  );
}
