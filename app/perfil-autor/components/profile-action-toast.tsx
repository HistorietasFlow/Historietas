import { profileActionToastStyle } from "../styles";

type ProfileActionToastProps = {
  message: string;
};

export function ProfileActionToast({ message }: ProfileActionToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div style={profileActionToastStyle} role="status" aria-live="polite">
      {message}
    </div>
  );
}
