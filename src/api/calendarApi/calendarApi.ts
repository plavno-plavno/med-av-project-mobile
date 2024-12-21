import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
import { IGetCalendarEventDetailsRequest, IGetCalendarEventDetailsResponse, IGetCalendarEventsResponse, IPostCalendarEventsRequest, IPostCalendarEventsResponse, IPutCalendarEventsRequest, IPutCalendarEventsResponse } from './types';

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
    updateEvent: builder.mutation<IPutCalendarEventsResponse, IPutCalendarEventsRequest>({
      query: ({id, color, description, endDate, gmtDelta, participants, startDate, title, status}) => ({
        url: `calendar/events/${id}`,
        method: 'PATCH',
        body: {
          title,
          startDate,
          endDate,
          participants,
          color,
          description,
          gmtDelta,
          status,
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
  useUpdateEventMutation,
  useDeleteEventMutation,
  useCreateEventMutation,
  useGetCalendarEventsQuery,
  useGetCalendarEventDetailsQuery,
} = calendarApi;
