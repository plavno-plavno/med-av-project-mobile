import {
  useEffect, useRef, useCallback, useState,
} from 'react';
import { Socket } from 'socket.io-client';
import { useMeetingAccessSocket } from './useMeetingAccessSocket';
import { useAuthMeQuery, useGetUsersByIdMutation } from 'src/api/userApi/userApi';
import { useGetRequestsByEventIdMutation } from 'src/api/calendarApi/calendarApi';

export interface JoinEventPayload {
  eventId: string;
}

export interface RequestJoinEventPayload {
  eventId: string;
  userId: string;
}

export interface RespondJoinRequestPayload {
  eventId: string;
  socketId: string;
  userId: string;
  accepted: boolean;
}

export type Departments = {
  name: string;
};

export interface User {
  id: number | string;
  photo: Photo | null;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  deletedAt: null | string;
  department: Departments;
  provider: string;
  title: string;
  phone: string;
  age: string;
  gender: string;
  gmtDelta: number;
  role: {
    id: number;
    name: string;
  };
  socialId: null | string | number;
  status: {
    id: number;
    name: string;
  };
  inputLanguage: {
    name: string;
    id: number;
    code: string;
  };
  outputLanguage: {
    name: string;
    id: number;
    code: string;
  };
  updatedAt: string;
  organization: Organization;
  storageUsage: string;
}

export type Photo = {
  id: string;
  path: string;
  link: string;
};

export interface Organization {
  id: number | string;
  location: string;
  staffCount: string;
  phoneNumber: string;

  name: string;
  domain: string;
  updatedAt: string;
  createdAt: string;
  photo: Photo | null;
  departments: any[];
}

export type UserWithSocket = User & { socketId?: string };
export type JoinRequestCallback = (data: RequestJoinEventPayload) => void;
export type RequestRespondedCallback = (
  data: RespondJoinRequestPayload
) => void;

type UseMeetingAccessProps = {
  setInvitedParticipants: (data: User[]) => void;
  setMeInvited: (data: boolean) => void;
  invitedParticipants: User[];
  eventId: string | null;
};

export const useMeetingAccess = ({
  setInvitedParticipants,
  setMeInvited,
  invitedParticipants,
  eventId,
}: UseMeetingAccessProps) => {
  const socketInstance = useMeetingAccessSocket();
  const pendingRequestsRef = useRef<UserWithSocket[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const isRequestModalOpenRef = useRef(false);
  const [newUser, setNewUser] = useState<UserWithSocket | null>(null);
  const invitedParticipantsRef = useRef<User[]>(invitedParticipants);
  const [isRequestingJoin, setIsRequestingJoin] = useState(false);

  const { data: authMeData } = useAuthMeQuery()
  const userRefId = useRef<number>();
  userRefId.current = authMeData?.id;

  const [getRequestsByEventId] = useGetRequestsByEventIdMutation();
  const [getUsersById] = useGetUsersByIdMutation()

  useEffect(() => {
    isRequestModalOpenRef.current = isRequestModalOpen;
  }, [isRequestModalOpen]);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const fetchRequests = async () => {
      try {
        const data = await getRequestsByEventId({ eventId }).unwrap()
        console.log(data, 'datadatadatadatadatadatadata');
        
        if (data.length) {
          for (const req of data) {
            console.log(req, 'reqreqreq');
            
            await handleNewJoinRequest(String(req.createdBy.id), req.socketId);
          }
        }
      } catch (error) {
        console.error('Error fetching calendar requests:', error);
      }
    };

    fetchRequests();
  }, [eventId]);

  const showNextRequest = () => {
    if (pendingRequestsRef.current.length > 0) {
      const [nextUser, ...rest] = pendingRequestsRef.current;
      setNewUser(nextUser);
      setIsRequestModalOpen(true);
      pendingRequestsRef.current = rest;
    }
  };

  const handleNewJoinRequest = async (userId: string, socketId: string) => {
    const joinedUser = invitedParticipantsRef.current.find(
      ({ id }) => String(id) === userId,
    );

    let newJoinedUser: any;

    if (!joinedUser) {
      const user = await getUsersById({ id: Number(userId) }).unwrap()

      newJoinedUser = {
        ...user.user,
        socketId
      };
      setInvitedParticipants([
        ...invitedParticipantsRef.current,
        newJoinedUser,
      ]);
    } else {
      newJoinedUser = {
        ...joinedUser,
        socketId
      };
    }

    pendingRequestsRef.current.push(newJoinedUser);

    if (!isRequestModalOpenRef.current) {
      showNextRequest();
      setNewUser(newJoinedUser);
    }
  };

  useEffect(() => {
    invitedParticipantsRef.current = invitedParticipants;
  }, [invitedParticipants]);

  const joinEvent = useCallback((payload: JoinEventPayload) => {
    console.log(socketInstance, 'socketInstancesocketInstance');
    console.log(payload, 'payloadpayloadpayloadpayload');
    
    socketInstance?.emit('joinEvent', payload);
  }, []);

  const requestJoinEvent = useCallback((payload: RequestJoinEventPayload) => {
    socketInstance?.emit('requestJoinEvent', payload);
    setIsRequestingJoin(true);
  }, []);

  const respondJoinRequest = (payload: RespondJoinRequestPayload) => {
    socketInstance?.emit('respondJoinRequest', payload);
  };

  const handleJoinRequest = useCallback(
    async ({ userId, socketId }: { userId: string; socketId: string }) => {
      try {
        await handleNewJoinRequest(userId, socketId);
      } catch (error) {
        console.error('Error handling join request:', error);
      }
    },
    [],
  );

  const handleRequestResponded = useCallback(() => {
    setIsRequestModalOpen(false);
    setNewUser(null);
    setTimeout(showNextRequest, 300);
  }, []);

  const handleJoinResponse = useCallback(
    async ({ accepted }: { accepted: boolean }) => {
      if (accepted) {
        const user = await getUsersById({ id: Number(userRefId.current) }).unwrap()

        setInvitedParticipants([...invitedParticipantsRef.current as any, user.user]);

        setIsRequestingJoin(false);
        setMeInvited(true);
        // open({
        //   message: 'You have got the permission to join the meeting',
        //   type: 'success',
        // });
      } else {
        // open({
        //   message: 'You were not allowed to join the meeting',
        //   type: 'error',
        // });
      }

      setIsRequestingJoin(false);
    },
    [],
  );

  const handleOnAny = (eventName: string) => {
    console.log(`!!!!! Incoming event: ${eventName} !!!!`);
  };

  useEffect(() => {
    if (!socketInstance) {
      return;
    }

    socketInstance.onAny(handleOnAny);

    socketInstance.on('joinRequest', handleJoinRequest);
    socketInstance.on('requestResponded', handleRequestResponded);
    socketInstance.on('joinResponse', handleJoinResponse);

    return () => {
      if (socketInstance) {
        socketInstance.offAny(handleOnAny);
        socketInstance.off('joinRequest', handleJoinRequest);
        socketInstance.off('requestResponded', handleRequestResponded);
        socketInstance.off('joinResponse', handleJoinResponse);
      }
    };
  }, [socketInstance]);

  return {
    joinEvent,
    requestJoinEvent,
    respondJoinRequest,
    isRequestModalOpen,
    setIsRequestModalOpen,
    newUser,
    isRequestingJoin,
  };
};
