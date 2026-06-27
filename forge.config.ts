import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import path from "node:path";

const iconPath = path.resolve(__dirname, "src", "assets", "AppIcon");

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      unpack: "**/assets/**",
    },
    executableName: "Escruta",
    extraResource: [path.join(__dirname, "src", "assets", "AppIcon.png")],
    icon: iconPath,
  },
  makers: [
    new MakerSquirrel({ setupIcon: `${iconPath}.ico` }),
    new MakerZIP({}, ["darwin", "linux"]),
    new MakerDeb({ options: { bin: "Escruta", icon: `${iconPath}.png` } }),
    new MakerRpm({ options: { bin: "Escruta", icon: `${iconPath}.png` } }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/main/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
  ],
};

export default config;
