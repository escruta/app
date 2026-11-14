import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Alert, Button, Divider, Modal, Spinner, TextField } from "@/components/ui";
import { useAuth, useFetch, useAccessibility } from "@/hooks";
import { CheckIcon, ChevronIcon } from "@/components/icons";
import { SettingsGroup, SettingsSection } from "../shared/SettingsSection";
import { SignOutModal } from "./SignOutModal";

export function AccountSection() {
  const { signOut, currentUser: user, fetchUserData } = useAuth();
  const { effectiveReducedMotion } = useAccessibility();

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [errorNameMessage, setErrorNameMessage] = useState("");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [errorDeleteMessage, setErrorDeleteMessage] = useState("");

  const { loading: isUpdatingName, refetch: updateName } = useFetch<void>(
    "/users/change-name",
    {
      method: "POST",
      params: { newName },
      onSuccess: () => {
        setIsNameModalOpen(false);
        fetchUserData();
      },
      onError: (error) => {
        setErrorNameMessage(error.message || "Something went wrong. Please try again.");
        console.error("Error updating name:", error.message);
      },
    },
    false,
  );

  const { loading: isDeletingAccount, refetch: executeDeleteAccount } = useFetch<void>(
    "/users/me",
    {
      method: "DELETE",
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setDeleteConfirmation("");
        signOut();
      },
      onError: (error) => {
        setErrorDeleteMessage(error.message || "Something went wrong. Please try again.");
        console.error("Error deleting account:", error.message);
      },
    },
    false,
  );

  const handleDeleteAccount = () => {
    if (deleteConfirmation.toLowerCase() !== "delete my account") {
      setErrorDeleteMessage("Please type 'delete my account' to confirm");
      return;
    }
    executeDeleteAccount();
  };

  const handleSignOut = () => {
    setIsSignOutModalOpen(false);
    signOut();
  };

  return (
    <SettingsSection
      title="Account"
      description="Manage your profile and account information."
      className="gap-6"
    >
      <SettingsGroup
        title="Profile"
        description="Your personal information associated with this account."
      >
        {user && (
          <div className="rounded-xs border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member since</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </div>
            </div>
          </div>
        )}
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setNewName(user?.name || "");
              setErrorNameMessage("");
              setIsNameModalOpen(true);
            }}
          >
            Change name
          </Button>
        </div>
      </SettingsGroup>

      <Divider className="my-0" />

      <SettingsGroup title="Session" description="End your current session on this device.">
        <div>
          <Button variant="secondary" onClick={() => setIsSignOutModalOpen(true)}>
            Sign out
          </Button>
        </div>
      </SettingsGroup>

      <Divider className="my-0" />

      <div className="overflow-hidden rounded-xs border border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setIsDangerZoneOpen((prev) => !prev)}
          aria-expanded={isDangerZoneOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50"
        >
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Danger zone</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <ChevronIcon
            direction={isDangerZoneOpen ? "up" : "down"}
            className="size-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500"
          />
        </button>

        <AnimatePresence initial={false}>
          {isDangerZoneOpen && (
            <motion.div
              initial={effectiveReducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={effectiveReducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={
                effectiveReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }
              }
              className="overflow-hidden"
            >
              <div className="border-t border-red-200 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                  Delete account
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={isNameModalOpen}
        onClose={() => {
          setIsNameModalOpen(false);
          setNewName(user?.name || "");
          setErrorNameMessage("");
        }}
        title="Change name"
        onSubmit={() => {
          if (newName && !isUpdatingName) updateName();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsNameModalOpen(false);
                setNewName(user?.name || "");
                setErrorNameMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => updateName()}
              disabled={!newName || isUpdatingName}
              icon={isUpdatingName ? <Spinner /> : <CheckIcon />}
            >
              {isUpdatingName ? "Updating" : "Update name"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            id="name"
            label="Name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          {errorNameMessage && <div className="text-sm text-red-500">{errorNameMessage}</div>}
        </div>
      </Modal>

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmation("");
          setErrorDeleteMessage("");
        }}
        title="Delete account"
        onSubmit={() => {
          if (deleteConfirmation.toLowerCase() === "delete my account" && !isDeletingAccount) {
            handleDeleteAccount();
          }
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmation("");
                setErrorDeleteMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={
                deleteConfirmation.toLowerCase() !== "delete my account" || isDeletingAccount
              }
              icon={isDeletingAccount ? <Spinner /> : undefined}
            >
              {isDeletingAccount ? "Deleting" : "Delete account"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">This is permanent.</span> Deleting your account will
            erase all your notebooks, notes, and sources, and it can&apos;t be undone.
          </p>

          <TextField
            id="delete-confirmation"
            label="Type 'delete my account' below to confirm"
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            autoFocus
          />
          {errorDeleteMessage && <Alert variant="danger" message={errorDeleteMessage} />}
        </div>
      </Modal>
    </SettingsSection>
  );
}
