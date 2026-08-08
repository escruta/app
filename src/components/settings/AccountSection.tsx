import { useState, useEffect } from "react";
import { Alert, Button, Modal, Spinner, TextField } from "@/components/ui";
import { useAuth, useFetch } from "@/hooks";
import { CheckIcon } from "@/components/icons";
import { SettingsSection } from "./SettingsSection";

export function AccountSection() {
  const { signOut, currentUser: user, fetchUserData } = useAuth();

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [errorNameMessage, setErrorNameMessage] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorPasswordMessage, setErrorPasswordMessage] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
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

  const { loading: isChangingPassword, refetch: changePassword } = useFetch<void>(
    "/users/change-password",
    {
      method: "POST",
      data: {
        currentPassword,
        newPassword,
      },
      onSuccess: () => {
        setIsPasswordModalOpen(false);
        resetPasswordFields();
        signOut();
      },
      onError: (error) => {
        setErrorPasswordMessage(error.message || "Something went wrong. Please try again.");
        console.error("Error changing password:", error.message);
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

  const checkPasswordStrength = (password: string) => {
    const criteria = [
      {
        valid: password.length >= 8,
        message: "Password must be at least 8 characters.",
      },
      {
        valid: /[A-Z]/.test(password),
        message: "Password must contain at least one uppercase letter.",
      },
      {
        valid: /[a-z]/.test(password),
        message: "Password must contain at least one lowercase letter.",
      },
      {
        valid: /[0-9]/.test(password),
        message: "Password must contain at least one number.",
      },
    ];

    const failedCriterion = criteria.find((criterion) => !criterion.valid);

    return {
      isValid: !failedCriterion,
      errorMessage: failedCriterion ? failedCriterion.message : "",
      lengthCriteria: criteria[0].valid,
      uppercaseCriteria: criteria[1].valid,
      lowercaseCriteria: criteria[2].valid,
      numberCriteria: criteria[3].valid,
    };
  };

  useEffect(() => {
    if (passwordTouched) {
      const validationResult = checkPasswordStrength(newPassword);
      setErrorPasswordMessage(validationResult.errorMessage);
    }
  }, [newPassword, passwordTouched]);

  const handlePasswordChange = () => {
    if (!currentPassword.trim()) {
      setErrorPasswordMessage("Please enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      setErrorPasswordMessage("Please enter a new password.");
      return;
    }

    const passwordValidation = checkPasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      setErrorPasswordMessage(passwordValidation.errorMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorPasswordMessage("Passwords don't match, please try again.");
      return;
    }
    changePassword();
  };

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorPasswordMessage("");
    setPasswordTouched(false);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation.toLowerCase() !== "delete my account") {
      setErrorDeleteMessage("Please type 'delete my account' to confirm");
      return;
    }
    executeDeleteAccount();
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (!passwordTouched) {
      setPasswordTouched(true);
    }
  };

  return (
    <SettingsSection
      title="Account"
      description="Manage your profile, security, and account information."
      className="gap-6"
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
              <p className="font-medium">{new Date(user.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setIsNameModalOpen(true)}>
          Change name
        </Button>
        <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>
          Change password
        </Button>
        <Button variant="secondary" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
      <div className="mt-2 rounded-xs border border-red-200 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-950/30">
        <h3 className="mb-1 text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
          Delete account
        </Button>
      </div>

      {/* Name Change Modal */}
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

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          resetPasswordFields();
        }}
        title="Change password"
        onSubmit={() => {
          if (currentPassword && newPassword && confirmPassword && !isChangingPassword) {
            handlePasswordChange();
          }
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsPasswordModalOpen(false);
                resetPasswordFields();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
              icon={isChangingPassword ? <Spinner /> : <CheckIcon />}
            >
              {isChangingPassword ? "Changing" : "Change password"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            id="current-password"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
          />
          <TextField
            id="new-password"
            label="New password"
            type="password"
            value={newPassword}
            onChange={handleNewPasswordChange}
            autoComplete="new-password"
          />
          <TextField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Password must be at least 8 characters long, contain uppercase and lowercase letters,
            and include at least one number. Your session will be closed after changing your
            password.
          </p>
          {errorPasswordMessage && (
            <div className="text-sm text-red-500">{errorPasswordMessage}</div>
          )}
        </div>
      </Modal>

      {/* Delete Account Modal */}
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
            erase all your notebooks, notes, and sources, and it can't be undone.
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
