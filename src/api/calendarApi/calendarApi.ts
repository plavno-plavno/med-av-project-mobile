import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
import { IGetCalendarEventDetailsRequest, IGetCalendarEventDetailsResponse, IGetCalendarEventsResponse } from './types';
// import { } from './types';

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
  useGetCalendarEventsQuery,
  useGetCalendarEventDetailsQuery,
} = calendarApi;
