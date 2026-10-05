import { Button, Modal } from "@/components/ui";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ isOpen, onClose, onConfirm }: SignOutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign out"
      width="sm"
      onSubmit={onConfirm}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Sign out
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Are you sure you want to sign out? You will need to sign in again to access your notebooks.
      </p>
    </Modal>
  );
}
