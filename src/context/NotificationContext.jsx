import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./NotificationContext.scss";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const notificationIdRef = useRef(0);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const notify = useCallback((payload) => {
    notificationIdRef.current += 1;
    setNotification({
      id: notificationIdRef.current,
      duration: 4600,
      tone: "neutral",
      ...(typeof payload === "string"
        ? { message: payload }
        : payload),
    });
  }, []);

  useEffect(() => {
    if (!notification) return undefined;

    const timeoutId = window.setTimeout(
      dismissNotification,
      notification.duration
    );

    return () => window.clearTimeout(timeoutId);
  }, [dismissNotification, notification]);

  const handleAction = () => {
    const action = notification?.onAction;
    dismissNotification();
    action?.();
  };

  return (
    <NotificationContext.Provider
      value={{ dismissNotification, notify }}
    >
      {children}

      {notification && (
        <div
          className={`app-toast app-toast--${notification.tone}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="app-toast__marker" aria-hidden="true"></span>
          <p>{notification.message}</p>

          {notification.actionLabel && notification.onAction && (
            <button
              className="app-toast__action"
              type="button"
              onClick={handleAction}
            >
              {notification.actionLabel}
            </button>
          )}

          <button
            className="app-toast__dismiss"
            type="button"
            aria-label="Dismiss notification"
            onClick={dismissNotification}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
};

export default NotificationContext;
