import { useEffect, useId, useMemo, useState } from "react";
import { FileTextIcon, RestartIcon, StarsIcon } from "@/components/icons";
import {
  Button,
  Checkbox,
  Modal,
  Select,
  Slider,
  Spinner,
  TextField,
  type SelectOption,
} from "@/components/ui";
import {
  PreferenceOptionButton,
  SelectionIndicator,
} from "@/components/settings/preferences/PreferenceCard";
import { cn } from "@/lib/utils";
import type {
  GenerationOptions,
  GenerationRequestPayload,
  JobType,
  QuestionType,
  Source,
  StudyGuideSection,
  ToolDetailLevel,
  ToolDifficulty,
} from "@/interfaces";
import { SelectSourcesModal } from "./SelectSourcesModal";
import {
  ALL_QUESTION_TYPES,
  ALL_STUDY_GUIDE_SECTIONS,
  MAX_FOCUS_TOPIC_LENGTH,
  TOOL_DEFINITIONS,
  getDefaultGenerationOptions,
} from "./toolConfig";

interface CustomizeToolModalProps {
  isOpen: boolean;
  toolType: JobType;
  sources: Source[];
  defaultSelectedSourceIds: string[];
  initialOptions?: GenerationOptions | null;
  initialTitle?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onGenerate: (payload: GenerationRequestPayload) => Promise<void> | void;
}

const DETAIL_SELECT_OPTIONS: SelectOption<ToolDetailLevel>[] = [
  { value: "CONCISE", label: "Concise" },
  { value: "STANDARD", label: "Standard" },
  { value: "DETAILED", label: "Detailed" },
];

const AUDIENCE_SELECT_OPTIONS: SelectOption<ToolDifficulty>[] = [
  { value: "EASY", label: "Introductory" },
  { value: "MEDIUM", label: "Intermediate" },
  { value: "HARD", label: "Advanced" },
];

function SectionHeading({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-medium text-gray-900 select-none dark:text-gray-100">{label}</p>
      {hint && (
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function RadioOptionCard({
  selected,
  onSelect,
  label,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}) {
  return (
    <PreferenceOptionButton selected={selected} onSelect={onSelect} className="p-3">
      <div className="flex w-full items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold transition-colors",
              selected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100",
            )}
          >
            {label}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <SelectionIndicator selected={selected} className="mt-0.5" />
      </div>
    </PreferenceOptionButton>
  );
}

export function CustomizeToolModal({
  isOpen,
  toolType,
  sources,
  defaultSelectedSourceIds,
  initialOptions,
  initialTitle = "",
  isSubmitting = false,
  onClose,
  onGenerate,
}: CustomizeToolModalProps) {
  const focusFieldId = useId();
  const titleFieldId = useId();

  const toolDef = TOOL_DEFINITIONS[toolType];
  const readySources = useMemo(() => sources.filter((s) => s.status === "READY"), [sources]);
  const readyIds = useMemo(() => readySources.map((s) => s.id), [readySources]);

  const computeInitialSelection = () => {
    if (initialOptions?.selectedSourceIds && initialOptions.selectedSourceIds.length > 0) {
      const valid = initialOptions.selectedSourceIds.filter((id) => readyIds.includes(id));
      if (valid.length > 0) return valid;
    }
    const validDefaults = defaultSelectedSourceIds.filter((id) => readyIds.includes(id));
    return validDefaults.length > 0 ? validDefaults : readyIds;
  };

  const defaults = useMemo(
    () => getDefaultGenerationOptions(toolType, defaultSelectedSourceIds, readySources.length),
    [toolType, defaultSelectedSourceIds, readySources.length],
  );

  const [customTitle, setCustomTitle] = useState(initialTitle);
  const [difficulty, setDifficulty] = useState<ToolDifficulty>(
    initialOptions?.difficulty ?? defaults.difficulty ?? "MEDIUM",
  );
  const [detailLevel, setDetailLevel] = useState<ToolDetailLevel>(
    initialOptions?.detailLevel ?? defaults.detailLevel ?? "STANDARD",
  );
  const [itemCount, setItemCount] = useState<number>(
    initialOptions?.itemCount ?? defaults.itemCount ?? (toolType === "FLASHCARDS" ? 15 : 10),
  );
  const [branchCount, setBranchCount] = useState<number>(
    initialOptions?.branchCount ?? defaults.branchCount ?? 6,
  );
  const [maxDepth, setMaxDepth] = useState<number>(
    initialOptions?.maxDepth ?? defaults.maxDepth ?? 3,
  );
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
    initialOptions?.questionTypes && initialOptions.questionTypes.length > 0
      ? initialOptions.questionTypes
      : ALL_QUESTION_TYPES.map((q) => q.value),
  );
  const [sections, setSections] = useState<StudyGuideSection[]>(
    initialOptions?.sections && initialOptions.sections.length > 0
      ? initialOptions.sections
      : ALL_STUDY_GUIDE_SECTIONS.map((s) => s.value),
  );
  const [focusTopic, setFocusTopic] = useState<string>(initialOptions?.focusTopic ?? "");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(computeInitialSelection);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const baseDefaults = getDefaultGenerationOptions(
      toolType,
      defaultSelectedSourceIds,
      readySources.length,
    );
    setCustomTitle(initialTitle);
    setDifficulty(initialOptions?.difficulty ?? baseDefaults.difficulty ?? "MEDIUM");
    setDetailLevel(initialOptions?.detailLevel ?? baseDefaults.detailLevel ?? "STANDARD");
    setItemCount(
      initialOptions?.itemCount ?? baseDefaults.itemCount ?? (toolType === "FLASHCARDS" ? 15 : 10),
    );
    setBranchCount(initialOptions?.branchCount ?? baseDefaults.branchCount ?? 6);
    setMaxDepth(initialOptions?.maxDepth ?? baseDefaults.maxDepth ?? 3);
    setQuestionTypes(
      initialOptions?.questionTypes && initialOptions.questionTypes.length > 0
        ? initialOptions.questionTypes
        : ALL_QUESTION_TYPES.map((q) => q.value),
    );
    setSections(
      initialOptions?.sections && initialOptions.sections.length > 0
        ? initialOptions.sections
        : ALL_STUDY_GUIDE_SECTIONS.map((s) => s.value),
    );
    setFocusTopic(initialOptions?.focusTopic ?? "");
    setSelectedSourceIds(computeInitialSelection());
    setIsSourcesModalOpen(false);
  }, [isOpen, toolType, initialOptions, initialTitle]);

  const handleResetDefaults = () => {
    setCustomTitle("");
    setDifficulty("MEDIUM");
    setDetailLevel("STANDARD");
    setItemCount(toolType === "FLASHCARDS" ? 15 : 10);
    setBranchCount(6);
    setMaxDepth(3);
    setQuestionTypes(ALL_QUESTION_TYPES.map((q) => q.value));
    setSections(ALL_STUDY_GUIDE_SECTIONS.map((s) => s.value));
    setFocusTopic("");
    setSelectedSourceIds(readyIds);
  };

  const toggleQuestionType = (qt: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(qt)) {
        return prev.length > 1 ? prev.filter((item) => item !== qt) : prev;
      }
      return [...prev, qt];
    });
  };

  const toggleSection = (section: StudyGuideSection) => {
    setSections((prev) => {
      if (prev.includes(section)) {
        return prev.length > 1 ? prev.filter((item) => item !== section) : prev;
      }
      return [...prev, section];
    });
  };

  const canGenerate = readySources.length > 0 && selectedSourceIds.length > 0 && !isSubmitting;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const useSubset = selectedSourceIds.length < readySources.length;
    const options: GenerationOptions = {
      difficulty,
      detailLevel,
      focusTopic: focusTopic.trim() || null,
      selectedSourceIds: useSubset ? selectedSourceIds : null,
      ...(toolType === "FLASHCARDS" ? { itemCount } : {}),
      ...(toolType === "QUESTIONNAIRE" ? { itemCount, questionTypes } : {}),
      ...(toolType === "STUDY_GUIDE" ? { sections } : {}),
      ...(toolType === "MIND_MAP" ? { branchCount, maxDepth } : {}),
    };

    await onGenerate({
      type: toolType,
      title: customTitle.trim() || null,
      options,
    });
  };

  const sourcesDescription =
    readySources.length === 0
      ? "No indexed sources available"
      : selectedSourceIds.length === readySources.length
        ? `All ${readySources.length} indexed ${readySources.length === 1 ? "source" : "sources"} included`
        : `${selectedSourceIds.length} of ${readySources.length} indexed sources selected`;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={toolDef.title}
        subtitle={toolDef.description}
        width="lg"
        contentClassname="max-h-[68vh]"
        onSubmit={handleGenerate}
        actions={
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<RestartIcon />}
              onClick={handleResetDefaults}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <div className="flex items-center gap-2.5">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!canGenerate}
                icon={isSubmitting ? <Spinner /> : <StarsIcon />}
              >
                {isSubmitting ? "Starting..." : "Generate"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {toolType === "FLASHCARDS" && (
            <>
              <Slider
                label="Number of cards"
                description="Choose how many flashcards to include in this deck."
                value={itemCount}
                min={5}
                max={30}
                step={1}
                valueLabel={`${itemCount} cards`}
                marks={[
                  { value: 5, label: "5" },
                  { value: 8, label: "8" },
                  { value: 15, label: "15" },
                  { value: 25, label: "25" },
                  { value: 30, label: "30" },
                ]}
                onChange={setItemCount}
              />

              <div>
                <SectionHeading label="Difficulty" />
                <div
                  role="radiogroup"
                  aria-label="Flashcard difficulty"
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                >
                  <RadioOptionCard
                    selected={difficulty === "EASY"}
                    onSelect={() => setDifficulty("EASY")}
                    label="Easy"
                    description="Core terms and direct recall"
                  />
                  <RadioOptionCard
                    selected={difficulty === "MEDIUM"}
                    onSelect={() => setDifficulty("MEDIUM")}
                    label="Medium"
                    description="Key concepts and links"
                  />
                  <RadioOptionCard
                    selected={difficulty === "HARD"}
                    onSelect={() => setDifficulty("HARD")}
                    label="Hard"
                    description="Nuances and application"
                  />
                </div>
              </div>
            </>
          )}

          {toolType === "QUESTIONNAIRE" && (
            <>
              <Slider
                label="Number of questions"
                description="Choose how many questions to include in this quiz."
                value={itemCount}
                min={3}
                max={25}
                step={1}
                valueLabel={`${itemCount} questions`}
                marks={[
                  { value: 3, label: "3" },
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 25, label: "25" },
                ]}
                onChange={setItemCount}
              />

              <div>
                <SectionHeading label="Difficulty" />
                <div
                  role="radiogroup"
                  aria-label="Questionnaire difficulty"
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                >
                  <RadioOptionCard
                    selected={difficulty === "EASY"}
                    onSelect={() => setDifficulty("EASY")}
                    label="Easy"
                    description="Direct comprehension"
                  />
                  <RadioOptionCard
                    selected={difficulty === "MEDIUM"}
                    onSelect={() => setDifficulty("MEDIUM")}
                    label="Medium"
                    description="Conceptual reasoning"
                  />
                  <RadioOptionCard
                    selected={difficulty === "HARD"}
                    onSelect={() => setDifficulty("HARD")}
                    label="Hard"
                    description="Critical thinking and edge cases"
                  />
                </div>
              </div>

              <div>
                <SectionHeading
                  label="Question formats"
                  hint="Select one or more question types to include."
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ALL_QUESTION_TYPES.map((qt) => {
                    const checked = questionTypes.includes(qt.value);
                    return (
                      <div
                        key={qt.value}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onClick={() => toggleQuestionType(qt.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleQuestionType(qt.value);
                          }
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-xs border p-2.5 transition-colors select-none",
                          checked
                            ? "border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/30"
                            : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600",
                        )}
                      >
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
                          {qt.label}
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleQuestionType(qt.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {toolType === "STUDY_GUIDE" && (
            <>
              <div>
                <SectionHeading label="Depth & length" />
                <div
                  role="radiogroup"
                  aria-label="Study guide depth"
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                >
                  <RadioOptionCard
                    selected={detailLevel === "CONCISE"}
                    onSelect={() => setDetailLevel("CONCISE")}
                    label="Concise"
                    description="Quick executive summary"
                  />
                  <RadioOptionCard
                    selected={detailLevel === "STANDARD"}
                    onSelect={() => setDetailLevel("STANDARD")}
                    label="Standard"
                    description="Balanced study breakdown"
                  />
                  <RadioOptionCard
                    selected={detailLevel === "DETAILED"}
                    onSelect={() => setDetailLevel("DETAILED")}
                    label="Detailed"
                    description="In-depth concepts and examples"
                  />
                </div>
              </div>

              <div>
                <SectionHeading
                  label="Included sections"
                  hint="Choose which sections appear in the study guide."
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ALL_STUDY_GUIDE_SECTIONS.map((sec) => {
                    const checked = sections.includes(sec.value);
                    return (
                      <div
                        key={sec.value}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onClick={() => toggleSection(sec.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSection(sec.value);
                          }
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-xs border p-2.5 transition-colors select-none",
                          checked
                            ? "border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/30"
                            : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600",
                        )}
                      >
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
                          {sec.label}
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={checked} onChange={() => toggleSection(sec.value)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {toolType === "MIND_MAP" && (
            <>
              <Slider
                label="Primary branches"
                description="Control how many main themes branch out from the central concept."
                value={branchCount}
                min={3}
                max={10}
                step={1}
                valueLabel={`${branchCount} branches`}
                marks={[
                  { value: 3, label: "3" },
                  { value: 4, label: "4" },
                  { value: 6, label: "6" },
                  { value: 8, label: "8" },
                  { value: 10, label: "10" },
                ]}
                onChange={(val) => {
                  setBranchCount(val);
                  setDetailLevel(val <= 4 ? "CONCISE" : val >= 8 ? "DETAILED" : "STANDARD");
                }}
              />

              <div>
                <SectionHeading label="Hierarchy depth" />
                <div
                  role="radiogroup"
                  aria-label="Mind map depth"
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                >
                  <RadioOptionCard
                    selected={maxDepth === 2}
                    onSelect={() => setMaxDepth(2)}
                    label="2 levels"
                    description="High-level overview"
                  />
                  <RadioOptionCard
                    selected={maxDepth === 3}
                    onSelect={() => setMaxDepth(3)}
                    label="3 levels"
                    description="Balanced hierarchy"
                  />
                  <RadioOptionCard
                    selected={maxDepth === 4}
                    onSelect={() => setMaxDepth(4)}
                    label="4 levels"
                    description="Deep sub-topic breakdown"
                  />
                </div>
              </div>
            </>
          )}

          <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
            {(toolType === "FLASHCARDS" || toolType === "QUESTIONNAIRE") && (
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {toolType === "FLASHCARDS" ? "Answer length" : "Explanation detail"}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {toolType === "FLASHCARDS"
                      ? "Adjust how concise or detailed the back of each card should be."
                      : "Adjust how thorough the rationale for each answer should be."}
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <Select
                    variant="compact"
                    size="sm"
                    align="right"
                    options={DETAIL_SELECT_OPTIONS}
                    value={detailLevel}
                    onChange={setDetailLevel}
                    ariaLabel={toolType === "FLASHCARDS" ? "Answer length" : "Explanation detail"}
                  />
                </div>
              </div>
            )}

            {(toolType === "STUDY_GUIDE" || toolType === "MIND_MAP") && (
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Complexity level
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Tailor terminology and conceptual depth to your target level.
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <Select
                    variant="compact"
                    size="sm"
                    align="right"
                    options={AUDIENCE_SELECT_OPTIONS}
                    value={difficulty}
                    onChange={setDifficulty}
                    ariaLabel="Complexity level"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Sources scope
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {sourcesDescription}
                </p>
              </div>
              <div className="shrink-0 self-start sm:self-center">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FileTextIcon />}
                  onClick={() => setIsSourcesModalOpen(true)}
                  disabled={readySources.length === 0}
                >
                  Choose sources
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 px-4 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <label
                    htmlFor={focusFieldId}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    Focus instructions
                  </label>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Optional topic, chapters, or angle for the AI to emphasize.
                  </p>
                </div>
                {focusTopic.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFocusTopic("")}
                    className="shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <TextField
                id={focusFieldId}
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value.slice(0, MAX_FOCUS_TOPIC_LENGTH))}
                placeholder={toolDef.focusPlaceholder}
                multiline
                minRows={2}
                maxRows={4}
                className="text-sm"
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {focusTopic.length} / {MAX_FOCUS_TOPIC_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor={titleFieldId}
              className="mb-1.5 block text-sm font-medium text-gray-900 select-none dark:text-gray-100"
            >
              Custom title{" "}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                (optional)
              </span>
            </label>
            <TextField
              id={titleFieldId}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value.slice(0, 120))}
              placeholder={`Leave empty to auto-generate a ${toolDef.title.toLowerCase()} title...`}
              className="text-sm"
            />
          </div>
        </div>
      </Modal>

      <SelectSourcesModal
        isOpen={isSourcesModalOpen}
        sources={sources}
        selectedSourceIds={selectedSourceIds}
        onClose={() => setIsSourcesModalOpen(false)}
        onApply={setSelectedSourceIds}
      />
    </>
  );
}
