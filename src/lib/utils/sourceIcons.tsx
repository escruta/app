import { LinkIcon, FileIcon, YouTubeIcon, NoteIcon } from "@/components/icons";
import type { SourceType } from "@/interfaces";

export function getSourceIcon(sourceType: SourceType) {
  switch (sourceType) {
    case "File":
      return <FileIcon />;
    case "YouTube Video":
      return <YouTubeIcon />;
    case "Text":
      return <NoteIcon />;
    case "Website":
      return <LinkIcon />;
  }
}
