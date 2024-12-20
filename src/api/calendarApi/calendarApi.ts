import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
import { IGetCalendarEventDetailsRequest, IGetCalendarEventDetailsResponse, IGetCalendarEventsResponse, IPostCalendarEventsRequest, IPostCalendarEventsResponse } from './types';

export const calendarApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: 'calendarApi',
  endpoints: (builder) => ({
    getCalendarEvents: builder.query<IGetCalendarEventsResponse, void>({
      query: () => ({
        url: 'calendar/events',
        method: 'GET',
      }),
    }),  
    createEvent: builder.mutation<IPostCalendarEventsResponse, IPostCalendarEventsRequest>({
      query: ({color, description, startDate, endDate, title, participants, gmtDelta}) => ({
        url: 'calendar/events',
        method: 'POST',
        body: {
          title,
          startDate,
          endDate,
          participants,
          color,
          description,
          gmtDelta,
        },
      }),
    }),
    deleteEvent: builder.mutation<void, {id: number}>({
      query: ({id}) => ({
        url: `calendar/events/${id}`,
        method: 'DELETE',
        body: {
          id,
        },
      }),
    }),
    getCalendarEventDetails: builder.query<IGetCalendarEventDetailsResponse, IGetCalendarEventDetailsRequest>({
      query: ({id}) => ({
        url: `calendar/events/${id}`,
        method: 'GET',
      }),
    }),
  
    refresh: builder.query<any, void>({
      query: () => ({ url: 'auth/refresh', method: 'GET' }),
    }),
  }),
});

export const {
  useDeleteEventMutation,
  useCreateEventMutation,
  useGetCalendarEventsQuery,
  useGetCalendarEventDetailsQuery,
} = calendarApi;
