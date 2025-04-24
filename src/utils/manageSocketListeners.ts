import { Socket } from 'socket.io-client';

export const subscribeToSocketEvents = (
  socket: Socket,
  handlers: Record<string, (...args: any[]) => void>,
) => {
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });
};

export const unsubscribeFromSocketEvents = (
  socket: Socket,
  handlers: Record<string, (...args: any[]) => void>,
) => {
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.off(event, handler);
  });
};
