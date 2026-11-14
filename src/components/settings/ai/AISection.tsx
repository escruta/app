import { useId } from "react";
import { ChatIcon, StudyIcon } from "@/components/icons";
import { Button, Divider, Select, Switch, TextField } from "@/components/ui";
import { useCookie } from "@/hooks";
import type { ChatMode } from "@/interfaces";
import { cn } from "@/lib/utils";
import {
  AI_AUTO_ADVANCE_FLASHCARDS_COOKIE_KEY,
  AI_AUTO_OVERVIEW_COOKIE_KEY,
  AI_CUSTOM_INSTRUCTIONS_COOKIE_KEY,
  AI_DEFAULT_CHAT_MODE_COOKIE_KEY,
  AI_MAX_CUSTOM_INSTRUCTIONS_LENGTH,
  AI_RESPONSE_DETAIL_COOKIE_KEY,
  AI_SHOW_CITED_SOURCES_COOKIE_KEY,
  AI_SHOW_EXAMPLE_QUESTIONS_COOKIE_KEY,
  CHAT_MODE_OPTIONS,
  DEFAULT_AI_SETTINGS,
  RESPONSE_DETAIL_OPTIONS,
  type ResponseDetail,
} from "../lib/ai";
import { PreferenceOptionButton, SelectionIndicator } from "../preferences/PreferenceCard";
import { SettingsGroup, SettingsSection } from "../shared/SettingsSection";

const CHAT_MODE_ICONS: Record<ChatMode, React.ReactNode> = {
  NORMAL: <ChatIcon className="size-4" />,
  LEARNING: <StudyIcon className="size-4" />,
};

export function AISection() {
  const instructionsId = useId();
  const exampleQuestionsLabelId = useId();
  const exampleQuestionsDescId = useId();
  const citedSourcesLabelId = useId();
  const citedSourcesDescId = useId();
  const autoOverviewLabelId = useId();
  const autoOverviewDescId = useId();
  const autoAdvanceLabelId = useId();
  const autoAdvanceDescId = useId();

  const { value: defaultChatMode, setValue: setDefaultChatMode } = useCookie<ChatMode>(
    AI_DEFAULT_CHAT_MODE_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.defaultChatMode,
  );
  const { value: responseDetail, setValue: setResponseDetail } = useCookie<ResponseDetail>(
    AI_RESPONSE_DETAIL_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.responseDetail,
  );
  const { value: customInstructions, setValue: setCustomInstructions } = useCookie<string>(
    AI_CUSTOM_INSTRUCTIONS_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.customInstructions,
  );
  const { value: showExampleQuestions, setValue: setShowExampleQuestions } = useCookie<boolean>(
    AI_SHOW_EXAMPLE_QUESTIONS_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.showExampleQuestions,
  );
  const { value: showCitedSources, setValue: setShowCitedSources } = useCookie<boolean>(
    AI_SHOW_CITED_SOURCES_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.showCitedSources,
  );
  const { value: autoGenerateOverview, setValue: setAutoGenerateOverview } = useCookie<boolean>(
    AI_AUTO_OVERVIEW_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.autoGenerateOverview,
  );
  const { value: autoAdvanceFlashcards, setValue: setAutoAdvanceFlashcards } = useCookie<boolean>(
    AI_AUTO_ADVANCE_FLASHCARDS_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.autoAdvanceFlashcards,
  );

  const normalizedInstructions = customInstructions ?? "";

  return (
    <SettingsSection
      title="AI"
      description="Configure how the assistant responds, cites your sources, and supports your study workflow."
      className="gap-6"
    >
      <SettingsGroup
        title="Chat & Assistant"
        description="Set the default tutoring style, response detail, and instructions used in new conversations."
      >
        <div
          role="radiogroup"
          aria-label="Default chat mode"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {CHAT_MODE_OPTIONS.map((option) => {
            const isSelected = defaultChatMode === option.value;
            return (
              <PreferenceOptionButton
                key={option.value}
                selected={isSelected}
                onSelect={() => setDefaultChatMode(option.value)}
                className="gap-3"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-xs transition-colors duration-200",
                        isSelected
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                          : "bg-gray-100 text-gray-500 group-hover:bg-blue-100/70 group-hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700 dark:group-hover:text-gray-200",
                      )}
                    >
                      {CHAT_MODE_ICONS[option.value]}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold transition-colors",
                          isSelected
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-900 dark:text-gray-100",
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <SelectionIndicator selected={isSelected} className="mt-0.5" />
                </div>
              </PreferenceOptionButton>
            );
          })}
        </div>

        <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Response detail
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Adjust how concise or thorough assistant answers should be by default.
              </p>
            </div>
            <div className="shrink-0 self-start sm:self-center">
              <Select
                variant="compact"
                size="sm"
                align="right"
                options={RESPONSE_DETAIL_OPTIONS}
                value={responseDetail}
                onChange={setResponseDetail}
                ariaLabel="Response detail"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <label
                  htmlFor={instructionsId}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  Custom instructions
                </label>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Optional guidance appended to chat prompts without overriding source grounding or
                  citations.
                </p>
              </div>
              {normalizedInstructions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomInstructions("")}
                  className="shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>

            <TextField
              id={instructionsId}
              value={normalizedInstructions}
              onChange={(e) =>
                setCustomInstructions(e.target.value.slice(0, AI_MAX_CUSTOM_INSTRUCTIONS_LENGTH))
              }
              placeholder="e.g., Use concrete examples, define technical terms briefly, and end with a quick takeaway."
              multiline
              minRows={2}
              maxRows={5}
              className="text-sm"
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {normalizedInstructions.length} / {AI_MAX_CUSTOM_INSTRUCTIONS_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </SettingsGroup>

      <Divider className="my-0" />

      <SettingsGroup
        title="Sources & Automation"
        description="Control starter prompts, citation badges, and automatic summaries inside notebooks."
      >
        <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p
                id={exampleQuestionsLabelId}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Suggested starter questions
              </p>
              <p
                id={exampleQuestionsDescId}
                className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
              >
                Show AI-generated starter questions above the input in empty conversations.
              </p>
            </div>
            <Switch
              checked={showExampleQuestions}
              onChange={setShowExampleQuestions}
              ariaLabelledBy={exampleQuestionsLabelId}
              ariaDescribedBy={exampleQuestionsDescId}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p
                id={citedSourcesLabelId}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Show cited sources
              </p>
              <p
                id={citedSourcesDescId}
                className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
              >
                Display inline citation links and cited source chips below assistant messages.
              </p>
            </div>
            <Switch
              checked={showCitedSources}
              onChange={setShowCitedSources}
              ariaLabelledBy={citedSourcesLabelId}
              ariaDescribedBy={citedSourcesDescId}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p
                id={autoOverviewLabelId}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Auto-generate notebook overview
              </p>
              <p
                id={autoOverviewDescId}
                className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
              >
                Automatically generate or refresh the overview summary when sources finish
                processing.
              </p>
            </div>
            <Switch
              checked={autoGenerateOverview}
              onChange={setAutoGenerateOverview}
              ariaLabelledBy={autoOverviewLabelId}
              ariaDescribedBy={autoOverviewDescId}
            />
          </div>
        </div>
      </SettingsGroup>

      <Divider className="my-0" />

      <SettingsGroup
        title="Learning Tools"
        description="Customize how generated study tools behave during review sessions."
      >
        <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p
                id={autoAdvanceLabelId}
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Auto-advance flashcards
              </p>
              <p
                id={autoAdvanceDescId}
                className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
              >
                Automatically move to the next card after marking a flashcard as known.
              </p>
            </div>
            <Switch
              checked={autoAdvanceFlashcards}
              onChange={setAutoAdvanceFlashcards}
              ariaLabelledBy={autoAdvanceLabelId}
              ariaDescribedBy={autoAdvanceDescId}
            />
          </div>
        </div>
      </SettingsGroup>
    </SettingsSection>
  );
}
