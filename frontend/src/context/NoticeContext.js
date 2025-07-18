import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NoticeContext = createContext();

export const useNotice = () => {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within a NoticeProvider');
  }
  return context;
};

export const NoticeProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [noticeCount, setNoticeCount] = useState(0);
  const [hasNewNotices, setHasNewNotices] = useState(false);
  const [notices, setNotices] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, [token]);

  useEffect(() => {
    if (user?.rollNumber && user.role === 'student') {
      fetchNoticeCount();
      const interval = setInterval(fetchNoticeCount, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchNoticeCount = async () => {
    if (!user?.rollNumber) return;
    
    try {
      const response = await axios.get(`/api/notices/student/${user.rollNumber}`);
      if (response.data.success) {
        const unseenCount = response.data.unseenCount;
        const hadNotices = noticeCount > 0;
        
        setNoticeCount(unseenCount);
        setHasNewNotices(unseenCount > 0);
        setNotices(response.data.data || []);
        
        if (unseenCount > noticeCount && hadNotices) {
          showNotificationToast(unseenCount - noticeCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notice count:', error);
    }
  };

  const showNotificationToast = (newCount) => {
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('New Notice Available!', {
        body: `You have ${newCount} new notice${newCount > 1 ? 's' : ''} from administration.`,
        icon: '/favicon.ico',
        tag: 'notice-notification'
      });
    }
  };

  const markNoticeAsSeen = async (noticeId) => {
    try {
      await axios.post(`/api/notices/${noticeId}/seen`, {
        studentRollNumber: user.rollNumber
      });
      
      // Update local state
      setNotices(notices.map(notice => 
        notice._id === noticeId 
          ? {
              ...notice, 
              seenBy: [...notice.seenBy, { 
                studentRollNumber: user.rollNumber, 
                seenAt: new Date() 
              }]
            }
          : notice
      ));
      
      // Recalculate unseen count
      const updatedUnseenCount = notices.filter(notice => 
        notice._id !== noticeId && 
        !notice.seenBy.some(seen => seen.studentRollNumber === user.rollNumber)
      ).length;
      
      setNoticeCount(updatedUnseenCount);
      setHasNewNotices(updatedUnseenCount > 0);
      
    } catch (error) {
      console.error('Error marking notice as seen:', error);
    }
  };

  const dismissNewNoticesBanner = () => {
    setHasNewNotices(false);
  };

  const requestNotificationPermission = () => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const value = {
    noticeCount,
    hasNewNotices,
    notices,
    loading,
    fetchNoticeCount,
    markNoticeAsSeen,
    dismissNewNoticesBanner,
    requestNotificationPermission
  };

  return (
    <NoticeContext.Provider value={value}>
      {children}
    </NoticeContext.Provider>
  );
};
