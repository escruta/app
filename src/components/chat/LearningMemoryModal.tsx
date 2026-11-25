import { useEffect, useId, useMemo, useState } from "react";
import {
  AddIcon,
  CardIcon,
  CheckIcon,
  CloseIcon,
  QuestionnaireIcon,
  RestartIcon,
  SlidersIcon,
  StudyIcon,
} from "@/components/icons";
import { CustomizeToolModal } from "@/components/tools/CustomizeToolModal";
import { MAX_FOCUS_TOPIC_LENGTH } from "@/components/tools/toolConfig";
import {
  Alert,
  Button,
  IconButton,
  Modal,
  Select,
  type SelectOption,
  Skeleton,
  Spinner,
  Switch,
  TextField,
  Tooltip,
} from "@/components/ui";
import { AUTH_TOKEN_KEY } from "@/config";
import { startToolGeneration, useCookie, useLearningMemory } from "@/hooks";
import type {
  GenerationJob,
  GenerationOptions,
  GenerationRequestPayload,
  JobType,
  ProficiencyLevel,
  Source,
  Token,
  ToolDifficulty,
} from "@/interfaces";
import { cn } from "@/lib/utils";

interface LearningMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  sources?: Source[];
  selectedSourceIds?: string[];
  onReviewWithTutor?: (concepts: string[]) => void;
  onOpenToolJob?: (job: GenerationJob) => void;
}

type ModalTab = "concepts" | "profile";

const MAX_GOAL_LENGTH = 500;
const MAX_NOTES_LENGTH = 1500;

const PROFICIENCY_OPTIONS: SelectOption<ProficiencyLevel>[] = [
  { value: "AUTO", label: "Auto" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

function mapProficiencyToDifficulty(level: ProficiencyLevel): ToolDifficulty {
  if (level === "BEGINNER") return "EASY";
  if (level === "ADVANCED") return "HARD";
  return "MEDIUM";
}

function buildWeakSpotsFocusTopic(concepts: string[]): string {
  const prefix = "Reinforce and test understanding of: ";
  const picked: string[] = [];
  let length = prefix.length;

  for (const concept of concepts) {
    const addition = (picked.length > 0 ? ", " : "") + concept;
    if (length + addition.length > MAX_FOCUS_TOPIC_LENGTH) {
      break;
    }
    picked.push(concept);
    length += addition.length;
  }

  if (picked.length === 0 && concepts[0]) {
    return `${prefix}${concepts[0]}`.slice(0, MAX_FOCUS_TOPIC_LENGTH);
  }
  return `${prefix}${picked.join(", ")}`;
}

function buildPracticeTitle(toolType: "QUESTIONNAIRE" | "FLASHCARDS", concepts: string[]): string {
  const suffix = toolType === "QUESTIONNAIRE" ? "Quiz" : "Flashcards";
  if (concepts.length === 1) {
    const label = concepts[0].length > 36 ? `${concepts[0].slice(0, 33).trim()}...` : concepts[0];
    return `Review ${suffix}: ${label}`;
  }
  return `Weak Spots Review ${suffix}`;
}

export function LearningMemoryModal({
  isOpen,
  onClose,
  notebookId,
  sources = [],
  selectedSourceIds = [],
  onReviewWithTutor,
  onOpenToolJob,
}: LearningMemoryModalProps) {
  const switchId = useId();
  const goalId = useId();
  const notesId = useId();

  const { value: token } = useCookie<Token>(AUTH_TOKEN_KEY);
  const { memory, isLoading, isSaving, error, clearError, updateMemory, resetMemory } =
    useLearningMemory(notebookId);

  const [activeTab, setActiveTab] = useState<ModalTab>("concepts");
  const [goalDraft, setGoalDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [addingTarget, setAddingTarget] = useState<"struggling" | "mastered" | null>(null);
  const [conceptDraft, setConceptDraft] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [practiceModalState, setPracticeModalState] = useState<{
    type: JobType;
    initialOptions: GenerationOptions;
    initialTitle: string;
  } | null>(null);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const readySources = useMemo(() => sources.filter((s) => s.status === "READY"), [sources]);
  const readySourceIds = useMemo(() => readySources.map((s) => s.id), [readySources]);
  const effectiveSelectedIds = useMemo(() => {
    const valid = selectedSourceIds.filter((id) => readySourceIds.includes(id));
    return valid.length > 0 ? valid : readySourceIds;
  }, [selectedSourceIds, readySourceIds]);
  const hasReadySources = readySources.length > 0;

  useEffect(() => {
    setGoalDraft(memory?.learningGoal ?? "");
    setNotesDraft(memory?.studyNotes ?? "");
  }, [memory?.learningGoal, memory?.studyNotes]);

  useEffect(() => {
    if (!isOpen) {
      setAddingTarget(null);
      setConceptDraft("");
      setPracticeError(null);
    }
  }, [isOpen]);

  const stats = memory?.stats;
  const hasStats = Boolean(
    stats &&
    (stats.flashcardsReviewed > 0 ||
      stats.quizQuestionsAnswered > 0 ||
      stats.learningTurnsCount > 0),
  );
  const hasAnyMemoryData = Boolean(
    memory &&
    (memory.proficiencyLevel !== "AUTO" ||
      memory.learningGoal ||
      memory.studyNotes ||
      memory.masteredConcepts.length > 0 ||
      memory.strugglingConcepts.length > 0 ||
      hasStats),
  );

  const quizAccuracy =
    stats && stats.quizQuestionsAnswered > 0
      ? Math.round((stats.quizQuestionsCorrect / stats.quizQuestionsAnswered) * 100)
      : null;

  const handleToggleEnabled = (nextEnabled: boolean) => {
    void updateMemory({ enabled: nextEnabled });
  };

  const handleLevelChange = (nextLevel: ProficiencyLevel) => {
    if (!memory || nextLevel === memory.proficiencyLevel) return;
    void updateMemory({ proficiencyLevel: nextLevel });
  };

  const handleCommitGoal = () => {
    if (!memory) return;
    const trimmed = goalDraft.trim();
    const current = (memory.learningGoal ?? "").trim();
    if (trimmed === current) return;
    void updateMemory({ learningGoal: trimmed });
  };

  const handleClearGoal = () => {
    setGoalDraft("");
    if (memory?.learningGoal) {
      void updateMemory({ learningGoal: "" });
    }
  };

  const handleCommitNotes = () => {
    if (!memory) return;
    const trimmed = notesDraft.trim();
    const current = (memory.studyNotes ?? "").trim();
    if (trimmed === current) return;
    void updateMemory({ studyNotes: trimmed });
  };

  const handleClearNotes = () => {
    setNotesDraft("");
    if (memory?.studyNotes) {
      void updateMemory({ studyNotes: "" });
    }
  };

  const handleAddConcept = () => {
    if (!memory) return;
    const trimmed = conceptDraft.trim();
    if (!trimmed || !addingTarget) {
      setAddingTarget(null);
      setConceptDraft("");
      return;
    }
    if (addingTarget === "mastered") {
      void updateMemory({ masteredConcepts: [...memory.masteredConcepts, trimmed] });
    } else {
      void updateMemory({ strugglingConcepts: [...memory.strugglingConcepts, trimmed] });
    }
    setConceptDraft("");
    setAddingTarget(null);
  };

  const handleCancelAdd = () => {
    setAddingTarget(null);
    setConceptDraft("");
  };

  const handleRemoveMastered = (concept: string) => {
    if (!memory) return;
    void updateMemory({
      masteredConcepts: memory.masteredConcepts.filter((c) => c !== concept),
    });
  };

  const handleRemoveStruggling = (concept: string) => {
    if (!memory) return;
    void updateMemory({
      strugglingConcepts: memory.strugglingConcepts.filter((c) => c !== concept),
    });
  };

  const handlePromoteToMastered = (concept: string) => {
    if (!memory) return;
    void updateMemory({
      masteredConcepts: [...memory.masteredConcepts, concept],
      strugglingConcepts: memory.strugglingConcepts.filter((c) => c !== concept),
    });
  };

  const handleReviewConceptOrAll = (concepts: string[]) => {
    onClose();
    onReviewWithTutor?.(concepts);
  };

  const handleConfirmReset = async () => {
    await resetMemory();
    setIsResetModalOpen(false);
  };

  const handleOpenPracticeModal = (toolType: "QUESTIONNAIRE" | "FLASHCARDS") => {
    if (!memory || !hasReadySources || memory.strugglingConcepts.length === 0) return;
    setPracticeError(null);
    setPracticeModalState({
      type: toolType,
      initialTitle: buildPracticeTitle(toolType, memory.strugglingConcepts),
      initialOptions: {
        difficulty: mapProficiencyToDifficulty(memory.proficiencyLevel),
        detailLevel: "STANDARD",
        focusTopic: buildWeakSpotsFocusTopic(memory.strugglingConcepts),
        selectedSourceIds: effectiveSelectedIds,
      },
    });
  };

  const handlePracticeSubmit = async (payload: GenerationRequestPayload) => {
    setIsGeneratingPractice(true);
    setPracticeError(null);
    try {
      const created = await startToolGeneration(notebookId, token?.token ?? undefined, payload);
      setPracticeModalState(null);
      onClose();
      onOpenToolJob?.(created);
    } catch (err) {
      setPracticeError(
        err instanceof Error ? err.message : "Could not start practice tool generation",
      );
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const combinedError = error ?? practiceError;
  const totalConcepts =
    (memory?.strugglingConcepts.length ?? 0) + (memory?.masteredConcepts.length ?? 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Learning memory"
        subtitle="Adapts Learning mode and generated study tools to your progress in this notebook."
        width="lg"
        contentClassname="max-h-[68vh]"
        actions={
          <div className="flex w-full items-center justify-between gap-3">
            <div>
              {hasAnyMemoryData && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RestartIcon />}
                  onClick={() => setIsResetModalOpen(true)}
                  disabled={isSaving}
                >
                  Reset
                </Button>
              )}
            </div>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <Skeleton lines={5} className="w-full" />
        ) : !memory ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Could not load learning memory for this notebook.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {combinedError && (
              <div
                onClick={() => {
                  clearError();
                  setPracticeError(null);
                }}
                className="cursor-pointer"
              >
                <Alert variant="danger" message={combinedError} />
              </div>
            )}

            <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
              <label
                htmlFor={switchId}
                className={cn(
                  "group flex items-center justify-between gap-4 px-4 py-3 transition-colors select-none",
                  isSaving
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40",
                )}
              >
                <span className="block min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Track learning progress
                    {isSaving && <Spinner size={12} className="text-blue-500 dark:text-blue-400" />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {memory.enabled
                      ? "Automatically updated from quizzes, flashcards, and Learning mode."
                      : "Paused — existing progress is preserved but inactive."}
                  </span>
                </span>
                <Switch
                  id={switchId}
                  checked={memory.enabled}
                  onChange={handleToggleEnabled}
                  disabled={isSaving}
                  ariaLabel="Toggle notebook learning memory"
                />
              </label>

              {memory.enabled && hasStats && stats && (
                <div className="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50/60 dark:divide-gray-800 dark:bg-gray-950/40">
                  <div className="flex flex-col px-4 py-2.5">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Quiz accuracy
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                        {quizAccuracy !== null ? `${quizAccuracy}%` : "—"}
                      </span>
                      {stats.quizQuestionsAnswered > 0 && (
                        <span className="text-xs text-gray-400 tabular-nums dark:text-gray-500">
                          {stats.quizQuestionsCorrect}/{stats.quizQuestionsAnswered}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col px-4 py-2.5">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Flashcards
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                        {stats.flashcardsReviewed > 0
                          ? `${stats.flashcardsKnown}/${stats.flashcardsReviewed}`
                          : "—"}
                      </span>
                      {stats.flashcardsReviewed > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">learned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col px-4 py-2.5">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Tutoring
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                        {stats.learningTurnsCount}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {stats.learningTurnsCount === 1 ? "turn" : "turns"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {memory.enabled && (
              <>
                <div
                  role="tablist"
                  aria-label="Learning memory sections"
                  className="grid grid-cols-2 gap-1 rounded-xs border border-gray-200 bg-gray-100/70 p-1 dark:border-gray-800 dark:bg-gray-950/60"
                >
                  {(
                    [
                      {
                        id: "concepts" as const,
                        label: "Concepts",
                        icon: <StudyIcon className="size-3.5" />,
                        count: totalConcepts,
                      },
                      {
                        id: "profile" as const,
                        label: "Profile & notes",
                        icon: <SlidersIcon className="size-3.5" />,
                        count: null,
                      },
                    ] as const
                  ).map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex cursor-pointer items-center justify-center gap-2 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all duration-150 select-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:outline-none dark:focus-visible:ring-blue-400/35",
                          active
                            ? "bg-white text-gray-900 shadow-xs ring-1 ring-gray-200/80 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                        )}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.count !== null && (
                          <span
                            className={cn(
                              "rounded-xs px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                              active
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                : "bg-gray-200/70 text-gray-500 dark:bg-gray-800/80 dark:text-gray-400",
                            )}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "concepts" ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Needs review
                          </h3>
                          <span className="rounded-xs bg-orange-100 px-1.5 py-0.5 text-[11px] font-medium text-orange-700 tabular-nums dark:bg-orange-950/60 dark:text-orange-300">
                            {memory.strugglingConcepts.length}
                          </span>
                        </div>
                        <Tooltip text="Add concept" position="top">
                          <IconButton
                            icon={<AddIcon className="size-3.5" />}
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setAddingTarget(addingTarget === "struggling" ? null : "struggling");
                              setConceptDraft("");
                            }}
                            ariaLabel="Add concept to review"
                          />
                        </Tooltip>
                      </div>

                      {addingTarget === "struggling" && (
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1">
                            <TextField
                              id={`add-struggling-concept-${notebookId}`}
                              value={conceptDraft}
                              onChange={(e) => setConceptDraft(e.target.value.slice(0, 80))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddConcept();
                                if (e.key === "Escape") handleCancelAdd();
                              }}
                              placeholder="Add a concept to reinforce..."
                              autoFocus
                              className="h-8 py-1 text-xs"
                            />
                          </div>
                          <Tooltip text="Add" position="top">
                            <IconButton
                              icon={<AddIcon className="size-4" />}
                              variant="primary"
                              size="sm"
                              onClick={handleAddConcept}
                              disabled={!conceptDraft.trim()}
                              ariaLabel="Add concept"
                            />
                          </Tooltip>
                          <Tooltip text="Cancel" position="top">
                            <IconButton
                              icon={<CloseIcon className="size-4" />}
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelAdd}
                              ariaLabel="Cancel adding concept"
                            />
                          </Tooltip>
                        </div>
                      )}

                      {memory.strugglingConcepts.length > 0 ? (
                        <>
                          <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
                            {memory.strugglingConcepts.map((concept) => (
                              <div
                                key={concept}
                                className="group flex min-w-0 items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                              >
                                {onReviewWithTutor && hasReadySources ? (
                                  <button
                                    type="button"
                                    onClick={() => handleReviewConceptOrAll([concept])}
                                    title={`Review with tutor: ${concept}`}
                                    className="line-clamp-2 min-w-0 flex-1 cursor-pointer text-left text-[13px] leading-snug wrap-break-word text-gray-800 transition-colors hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
                                  >
                                    {concept}
                                  </button>
                                ) : (
                                  <span
                                    title={concept}
                                    className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug wrap-break-word text-gray-800 dark:text-gray-200"
                                  >
                                    {concept}
                                  </span>
                                )}

                                <div className="flex shrink-0 items-center gap-0.5">
                                  {onReviewWithTutor && hasReadySources && (
                                    <Tooltip text="Review with tutor" position="top">
                                      <IconButton
                                        icon={<StudyIcon className="size-3.5" />}
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => handleReviewConceptOrAll([concept])}
                                        ariaLabel={`Review ${concept} with tutor`}
                                      />
                                    </Tooltip>
                                  )}
                                  <Tooltip text="Mark as mastered" position="top">
                                    <IconButton
                                      icon={<CheckIcon className="size-3.5" />}
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handlePromoteToMastered(concept)}
                                      ariaLabel={`Mark ${concept} as mastered`}
                                    />
                                  </Tooltip>
                                  <Tooltip text="Remove" position="top">
                                    <IconButton
                                      icon={<CloseIcon className="size-3.5" />}
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleRemoveStruggling(concept)}
                                      ariaLabel={`Remove ${concept}`}
                                    />
                                  </Tooltip>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {onReviewWithTutor && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<StudyIcon />}
                                disabled={!hasReadySources}
                                onClick={() => handleReviewConceptOrAll(memory.strugglingConcepts)}
                              >
                                Review with tutor
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<QuestionnaireIcon />}
                              disabled={!hasReadySources}
                              onClick={() => handleOpenPracticeModal("QUESTIONNAIRE")}
                            >
                              Practice quiz
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<CardIcon />}
                              disabled={!hasReadySources}
                              onClick={() => handleOpenPracticeModal("FLASHCARDS")}
                            >
                              Practice flashcards
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="rounded-xs border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                          Missed quiz questions, flagged flashcards, or tricky topics will appear
                          here.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Mastered
                          </h3>
                          <span className="rounded-xs bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-700 tabular-nums dark:bg-green-950/60 dark:text-green-300">
                            {memory.masteredConcepts.length}
                          </span>
                        </div>
                        <Tooltip text="Add concept" position="top">
                          <IconButton
                            icon={<AddIcon className="size-3.5" />}
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setAddingTarget(addingTarget === "mastered" ? null : "mastered");
                              setConceptDraft("");
                            }}
                            ariaLabel="Add mastered concept"
                          />
                        </Tooltip>
                      </div>

                      {addingTarget === "mastered" && (
                        <div className="flex items-center gap-1.5">
                          <div className="min-w-0 flex-1">
                            <TextField
                              id={`add-mastered-concept-${notebookId}`}
                              value={conceptDraft}
                              onChange={(e) => setConceptDraft(e.target.value.slice(0, 80))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddConcept();
                                if (e.key === "Escape") handleCancelAdd();
                              }}
                              placeholder="Add a mastered concept..."
                              autoFocus
                              className="h-8 py-1 text-xs"
                            />
                          </div>
                          <Tooltip text="Add" position="top">
                            <IconButton
                              icon={<AddIcon className="size-4" />}
                              variant="primary"
                              size="sm"
                              onClick={handleAddConcept}
                              disabled={!conceptDraft.trim()}
                              ariaLabel="Add concept"
                            />
                          </Tooltip>
                          <Tooltip text="Cancel" position="top">
                            <IconButton
                              icon={<CloseIcon className="size-4" />}
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelAdd}
                              ariaLabel="Cancel adding concept"
                            />
                          </Tooltip>
                        </div>
                      )}

                      {memory.masteredConcepts.length > 0 ? (
                        <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
                          {memory.masteredConcepts.map((concept) => (
                            <div
                              key={concept}
                              className="group flex min-w-0 items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                            >
                              <span
                                title={concept}
                                className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug wrap-break-word text-gray-700 dark:text-gray-300"
                              >
                                {concept}
                              </span>
                              <Tooltip text="Remove" position="top">
                                <IconButton
                                  icon={<CloseIcon className="size-3.5" />}
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleRemoveMastered(concept)}
                                  ariaLabel={`Remove ${concept}`}
                                />
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xs border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                          Learned flashcards, correct quiz topics, and mastered ideas will appear
                          here.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
                    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Proficiency level
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                          Guides explanation depth and default difficulty for practice tools.
                        </p>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        <Select
                          variant="compact"
                          size="sm"
                          align="right"
                          options={PROFICIENCY_OPTIONS}
                          value={memory.proficiencyLevel}
                          onChange={handleLevelChange}
                          ariaLabel="Proficiency level"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 px-4 py-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <label
                            htmlFor={goalId}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Learning goal
                          </label>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            What you want to achieve with this notebook.
                          </p>
                        </div>
                        {goalDraft.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearGoal}
                            className="shrink-0"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <TextField
                        id={goalId}
                        value={goalDraft}
                        onChange={(e) => setGoalDraft(e.target.value.slice(0, MAX_GOAL_LENGTH))}
                        onBlur={handleCommitGoal}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="e.g., Prepare for Friday's midterm, master proofs and derivations..."
                      />
                      <div className="flex justify-end">
                        <span className="text-xs text-gray-400 tabular-nums dark:text-gray-500">
                          {goalDraft.length} / {MAX_GOAL_LENGTH}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 px-4 py-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <label
                            htmlFor={notesId}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Tutoring notes
                          </label>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Observations on pacing, examples, or preferences that help you learn.
                          </p>
                        </div>
                        {notesDraft.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearNotes}
                            className="shrink-0"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <TextField
                        id={notesId}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value.slice(0, MAX_NOTES_LENGTH))}
                        onBlur={handleCommitNotes}
                        placeholder="e.g., Prefers concrete numerical examples before formal proofs..."
                        multiline
                        minRows={3}
                        maxRows={5}
                      />
                      <div className="flex justify-end">
                        <span className="text-xs text-gray-400 tabular-nums dark:text-gray-500">
                          {notesDraft.length} / {MAX_NOTES_LENGTH}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset learning memory"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReset}
              disabled={isSaving}
              icon={isSaving ? <Spinner className="size-4" /> : undefined}
            >
              {isSaving ? "Resetting..." : "Reset"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This will clear your learning goal, mastered and review concepts, tutoring notes, and
          practice statistics for this notebook. Your sources, notes, and conversations will not be
          affected.
        </p>
      </Modal>

      {practiceModalState && (
        <CustomizeToolModal
          isOpen={Boolean(practiceModalState)}
          toolType={practiceModalState.type}
          sources={sources}
          defaultSelectedSourceIds={effectiveSelectedIds}
          initialOptions={practiceModalState.initialOptions}
          initialTitle={practiceModalState.initialTitle}
          isSubmitting={isGeneratingPractice}
          onClose={() => setPracticeModalState(null)}
          onGenerate={handlePracticeSubmit}
        />
      )}
    </>
  );
}
