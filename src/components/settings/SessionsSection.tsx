import { useFetch } from "@/hooks";
import type { Session } from "@/interfaces";
import { Alert, Button, Spinner } from "@/components/ui";
import { DevicesIcon } from "@/components/icons";
import { SettingsGroup, SettingsSection } from "./SettingsSection";

function detectBrowser(userAgent: string): string {
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Google Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Unknown browser";
}

function detectOperatingSystem(userAgent: string): string {
  const architecture = userAgent.match(/(x86_64|amd64|x86|aarch64|arm64|armv7l|i686)/i)?.[1];

  if (/windows/i.test(userAgent)) return architecture ? `Windows ${architecture}` : "Windows";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/mac os x|macintosh/i.test(userAgent))
    return architecture ? `macOS ${architecture}` : "macOS";
  if (/linux/i.test(userAgent)) return architecture ? `Linux ${architecture}` : "Linux";
  return "Unknown OS";
}

const DESKTOP_USER_AGENT = /Escruta\/[\d.]+\s*\((.+)\)/i;

function describeSession(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  const desktop = userAgent.match(DESKTOP_USER_AGENT);
  if (desktop) {
    const operatingSystem = desktop[1].split(";")[0].trim();
    return `Escruta Desktop on ${operatingSystem}`;
  }

  if (/electron\//i.test(userAgent)) {
    return `Escruta Desktop on ${detectOperatingSystem(userAgent)}`;
  }

  return `${detectBrowser(userAgent)} on ${detectOperatingSystem(userAgent)}`;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function SessionRow({ session, onRevoked }: { session: Session; onRevoked: () => void }) {
  const { loading: isRevoking, refetch: revokeSession } = useFetch<void>(
    session.sessionId ? `/sessions/${session.sessionId}` : "",
    {
      method: "DELETE",
      onSuccess: () => onRevoked(),
      onError: (error) => console.error("Error revoking session:", error.message),
    },
    false,
  );

  const canRevoke = Boolean(session.sessionId) && !session.current;

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <DevicesIcon className="size-5 shrink-0 text-gray-400 dark:text-gray-500" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {describeSession(session.userAgent)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Signed in {formatTimestamp(session.createdAt)}</span>
            <span>Expires {formatTimestamp(session.expiresAt)}</span>
            {session.ipAddress && <span>IP {session.ipAddress}</span>}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        {session.current ? (
          <span className="rounded-xs bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            This device
          </span>
        ) : (
          canRevoke && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => revokeSession()}
              disabled={isRevoking}
              icon={isRevoking ? <Spinner size={16} /> : undefined}
            >
              {isRevoking ? "Revoking" : "Revoke"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export function SessionsSection() {
  const {
    data: sessions,
    loading,
    error,
    refetch,
  } = useFetch<Session[]>("/sessions", {
    onError: (fetchError) => console.error("Error fetching sessions:", fetchError.message),
  });

  const { loading: isRevokingOthers, refetch: revokeOtherSessions } = useFetch<void>(
    "/sessions",
    {
      method: "DELETE",
      onSuccess: () => refetch(true, false),
      onError: (fetchError) => console.error("Error revoking sessions:", fetchError.message),
    },
    false,
  );

  const otherSessionsCount = sessions?.filter((session) => !session.current).length ?? 0;

  return (
    <SettingsSection
      title="Active sessions"
      description="Devices and browsers currently signed in to your account. Revoke any session you don't recognize."
      className="gap-6"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner aria-label="Loading sessions" />
        </div>
      ) : error ? (
        <Alert variant="danger" message={error.message || "We couldn't load your sessions."} />
      ) : !sessions || sessions.length === 0 ? (
        <div className="rounded-xs border border-dashed border-gray-300 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-700 dark:bg-gray-900/30">
          <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xs border border-gray-200 dark:border-gray-800">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {sessions.map((session, index) => (
                <SessionRow
                  key={session.sessionId ?? `session-${index}`}
                  session={session}
                  onRevoked={() => refetch(true, false)}
                />
              ))}
            </div>
          </div>

          <SettingsGroup title="Security">
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              If you notice unfamiliar activity, sign out of every other session and change your
              name or sign in again to secure your account.
            </p>
            <div>
              <Button
                variant="secondary"
                onClick={() => revokeOtherSessions()}
                disabled={otherSessionsCount === 0 || isRevokingOthers}
                icon={isRevokingOthers ? <Spinner size={18} /> : undefined}
              >
                {isRevokingOthers ? "Signing out" : "Sign out other sessions"}
              </Button>
            </div>
          </SettingsGroup>
        </>
      )}
    </SettingsSection>
  );
}
