import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';

const ICONS = {
  USER_LOGIN: '🔐',
  USER_CREATED: '✅',
  USER_UPDATED: '✏️',
  USER_DELETED: '🗑️',
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (data) => {
      const icon = ICONS[data.type] || '🔔';
      toast(`${icon} ${data.message}`, {
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
        },
        duration: 4000,
      });

      setNotifications((prev) => [
        { ...data, id: Date.now() },
        ...prev.slice(0, 19),
      ]);
    };

    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, []);

  const clearAll = () => setNotifications([]);

  return { notifications, clearAll };
};
