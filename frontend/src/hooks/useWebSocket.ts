import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketData {
  metrics?: {
    activeSpots: number;
    queueLength: number;
    employeesOnline: number;
    dailyRevenue: number;
  };
  activity?: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
  };
}

export const useWebSocket = (url?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<WebSocketData>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socketRef.current.on('dashboard-update', (newData: WebSocketData) => {
      setData(prevData => ({
        ...prevData,
        ...newData
      }));
    });

    socketRef.current.on('real-time-metrics', (metrics: any) => {
      setData(prevData => ({
        ...prevData,
        metrics
      }));
    });

    socketRef.current.on('new-activity', (activity: any) => {
      setData(prevData => ({
        ...prevData,
        activity
      }));
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    data,
    emit,
    socket: socketRef.current
  };
};