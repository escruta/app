import { useEffect, useState } from "react";
import { AddIcon, CheckIcon, CloseIcon, RestartIcon, StudyIcon } from "@/components/icons";
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
import { useLearningMemory } from "@/hooks";
import type { ProficiencyLevel } from "@/interfaces";
import { cn } from "@/lib/utils";

interface LearningMemorySectionProps {
  notebookId: string;
}

const PROFICIENCY_OPTIONS: SelectOption<ProficiencyLevel>[] = [
  { value: "AUTO", label: "Auto" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function LearningMemorySection({ notebookId }: LearningMemorySectionProps) {
  const { memory, isLoading, isSaving, error, clearError, updateMemory, resetMemory } =
    useLearningMemory(notebookId);

  const [goalDraft, setGoalDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [addingTarget, setAddingTarget] = useState<"struggling" | "mastered" | null>(null);
  const [conceptDraft, setConceptDraft] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    setGoalDraft(memory?.learningGoal ?? "");
    setNotesDraft(memory?.studyNotes ?? "");
  }, [memory?.learningGoal, memory?.studyNotes]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold tracking-widest text-gray-500 uppercase select-none dark:text-gray-400">
          Learning memory
        </div>
        <Skeleton lines={4} className="w-full" />
      </div>
    );
  }

  if (!memory) {
    return null;
  }

  const { stats } = memory;
  const hasStats =
    stats.flashcardsReviewed > 0 || stats.quizQuestionsAnswered > 0 || stats.learningTurnsCount > 0;
  const hasAnyMemoryData =
    memory.proficiencyLevel !== "AUTO" ||
    Boolean(memory.learningGoal) ||
    Boolean(memory.studyNotes) ||
    memory.masteredConcepts.length > 0 ||
    memory.strugglingConcepts.length > 0 ||
    hasStats;

  const handleToggleEnabled = (nextEnabled: boolean) => {
    void updateMemory({ enabled: nextEnabled });
  };

  const handleLevelChange = (nextLevel: ProficiencyLevel) => {
    if (nextLevel === memory.proficiencyLevel) return;
    void updateMemory({ proficiencyLevel: nextLevel });
  };

  const handleCommitGoal = () => {
    const trimmed = goalDraft.trim();
    const current = (memory.learningGoal ?? "").trim();
    if (trimmed === current) return;
    void updateMemory({ learningGoal: trimmed });
  };

  const handleCommitNotes = () => {
    const trimmed = notesDraft.trim();
    const current = (memory.studyNotes ?? "").trim();
    if (trimmed === current) return;
    void updateMemory({ studyNotes: trimmed });
  };

  const handleAddConcept = () => {
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

  const handleRemoveMastered = (concept: string) => {
    void updateMemory({
      masteredConcepts: memory.masteredConcepts.filter((c) => c !== concept),
    });
  };

  const handleRemoveStruggling = (concept: string) => {
    void updateMemory({
      strugglingConcepts: memory.strugglingConcepts.filter((c) => c !== concept),
    });
  };

  const handlePromoteToMastered = (concept: string) => {
    void updateMemory({
      masteredConcepts: [...memory.masteredConcepts, concept],
      strugglingConcepts: memory.strugglingConcepts.filter((c) => c !== concept),
    });
  };

  const handleConfirmReset = async () => {
    await resetMemory();
    setIsResetModalOpen(false);
  };

  const quizAccuracy =
    stats.quizQuestionsAnswered > 0
      ? Math.round((stats.quizQuestionsCorrect / stats.quizQuestionsAnswered) * 100)
      : null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <StudyIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold tracking-widest text-gray-500 uppercase select-none dark:text-gray-400">
              Learning memory
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isSaving && <Spinner size={12} className="text-blue-500 dark:text-blue-400" />}
            {hasAnyMemoryData && (
              <Tooltip text="Reset learning memory" position="bottom">
                <IconButton
                  icon={<RestartIcon />}
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsResetModalOpen(true)}
                  disabled={isSaving}
                  ariaLabel="Reset learning memory"
                />
              </Tooltip>
            )}
            <Tooltip
              text={memory.enabled ? "Pause learning memory" : "Enable learning memory"}
              position="bottom"
            >
              <Switch
                checked={memory.enabled}
                onChange={handleToggleEnabled}
                disabled={isSaving}
                ariaLabel="Toggle notebook learning memory"
              />
            </Tooltip>
          </div>
        </div>

        {error && (
          <div onClick={clearError} className="cursor-pointer">
            <Alert variant="danger" message={error} />
          </div>
        )}

        {!memory.enabled ? (
          <p className="rounded-xs border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
            Learning memory is paused for this notebook. Existing progress is preserved and will not
            influence tutoring or generated study tools until re-enabled.
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Tracks what you&apos;ve mastered and where you need reinforcement across Learning mode
              and study tools in this notebook.
            </p>

            {hasStats && (
              <div className="flex flex-wrap gap-1.5">
                {stats.flashcardsReviewed > 0 && (
                  <span className="rounded-xs border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 tabular-nums dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
                    Flashcards {stats.flashcardsKnown}/{stats.flashcardsReviewed}
                  </span>
                )}
                {quizAccuracy !== null && (
                  <span className="rounded-xs border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 tabular-nums dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
                    Quiz {quizAccuracy}% ({stats.quizQuestionsCorrect}/{stats.quizQuestionsAnswered}
                    )
                  </span>
                )}
                {stats.learningTurnsCount > 0 && (
                  <span className="rounded-xs border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 tabular-nums dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
                    {stats.learningTurnsCount} tutor{" "}
                    {stats.learningTurnsCount === 1 ? "turn" : "turns"}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 rounded-xs border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Proficiency level
              </span>
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

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`learning-goal-${notebookId}`}
                className="text-[11px] font-semibold text-gray-600 dark:text-gray-400"
              >
                Learning goal
              </label>
              <TextField
                id={`learning-goal-${notebookId}`}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value.slice(0, 500))}
                onBlur={handleCommitGoal}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                placeholder="e.g., Prepare for Friday's exam, understand derivations..."
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Needs review ({memory.strugglingConcepts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddingTarget(addingTarget === "struggling" ? null : "struggling");
                    setConceptDraft("");
                  }}
                  className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <AddIcon className="size-3" />
                  Add
                </button>
              </div>

              {addingTarget === "struggling" && (
                <div className="flex items-center gap-1.5">
                  <TextField
                    id={`add-struggling-concept-${notebookId}`}
                    value={conceptDraft}
                    onChange={(e) => setConceptDraft(e.target.value.slice(0, 80))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddConcept();
                      if (e.key === "Escape") {
                        setAddingTarget(null);
                        setConceptDraft("");
                      }
                    }}
                    placeholder="Concept to reinforce..."
                    autoFocus
                    className="flex-1 text-xs"
                  />
                  <Button size="sm" variant="primary" onClick={handleAddConcept}>
                    Add
                  </Button>
                </div>
              )}

              {memory.strugglingConcepts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {memory.strugglingConcepts.map((concept) => (
                    <span
                      key={concept}
                      className="inline-flex max-w-full items-center gap-1 rounded-xs border border-amber-200 bg-amber-50/80 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      <span className="truncate" title={concept}>
                        {concept}
                      </span>
                      <Tooltip text="Mark as mastered" position="top">
                        <button
                          type="button"
                          onClick={() => handlePromoteToMastered(concept)}
                          className="cursor-pointer rounded-xs p-0.5 text-amber-600 transition-colors hover:bg-green-100 hover:text-green-700 dark:text-amber-300 dark:hover:bg-green-900/60 dark:hover:text-green-300"
                          aria-label={`Mark ${concept} as mastered`}
                        >
                          <CheckIcon className="size-3" />
                        </button>
                      </Tooltip>
                      <button
                        type="button"
                        onClick={() => handleRemoveStruggling(concept)}
                        className="cursor-pointer rounded-xs p-0.5 text-amber-600 transition-colors hover:bg-amber-200/70 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-900/60 dark:hover:text-amber-100"
                        aria-label={`Remove ${concept}`}
                      >
                        <CloseIcon className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Missed quiz questions, flagged flashcards, or tricky topics will appear here.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-green-700 dark:text-green-400">
                  Mastered ({memory.masteredConcepts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddingTarget(addingTarget === "mastered" ? null : "mastered");
                    setConceptDraft("");
                  }}
                  className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <AddIcon className="size-3" />
                  Add
                </button>
              </div>

              {addingTarget === "mastered" && (
                <div className="flex items-center gap-1.5">
                  <TextField
                    id={`add-mastered-concept-${notebookId}`}
                    value={conceptDraft}
                    onChange={(e) => setConceptDraft(e.target.value.slice(0, 80))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddConcept();
                      if (e.key === "Escape") {
                        setAddingTarget(null);
                        setConceptDraft("");
                      }
                    }}
                    placeholder="Concept already understood..."
                    autoFocus
                    className="flex-1 text-xs"
                  />
                  <Button size="sm" variant="primary" onClick={handleAddConcept}>
                    Add
                  </Button>
                </div>
              )}

              {memory.masteredConcepts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {memory.masteredConcepts.map((concept) => (
                    <span
                      key={concept}
                      className="inline-flex max-w-full items-center gap-1 rounded-xs border border-green-200 bg-green-50/80 px-2 py-0.5 text-xs font-medium text-green-800 dark:border-green-800/60 dark:bg-green-950/40 dark:text-green-200"
                    >
                      <span className="truncate" title={concept}>
                        {concept}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMastered(concept)}
                        className="cursor-pointer rounded-xs p-0.5 text-green-600 transition-colors hover:bg-green-200/70 hover:text-green-900 dark:text-green-300 dark:hover:bg-green-900/60 dark:hover:text-green-100"
                        aria-label={`Remove ${concept}`}
                      >
                        <CloseIcon className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Learned flashcards, correct quiz topics, and mastered ideas will appear here.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor={`learning-notes-${notebookId}`}
                className="text-[11px] font-semibold text-gray-600 dark:text-gray-400"
              >
                Tutoring notes
              </label>
              <TextField
                id={`learning-notes-${notebookId}`}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value.slice(0, 1500))}
                onBlur={handleCommitNotes}
                placeholder="Notes on how you learn best in this notebook..."
                multiline
                minRows={2}
                maxRows={4}
                className={cn("text-xs")}
              />
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
