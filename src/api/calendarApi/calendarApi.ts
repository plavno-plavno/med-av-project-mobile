import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReAuth } from ".."
import {
  ICreateInstantEventResponse,
  IGetCalendarEventDetailsRequest,
  IGetCalendarEventDetailsResponse,
  IGetCalendarEventsResponse,
  IPostCalendarEventsRequest,
  IPostCalendarEventsResponse,
  IPutCalendarEventsRequest,
  IPutCalendarEventsResponse,
  ITimezoneOptionsRequest,
  ITimezoneOptionsResponse,
} from "./types"

export const calendarApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: "calendarApi",
  endpoints: (builder) => ({
    getCalendarEvents: builder.query<IGetCalendarEventsResponse, void>({
      query: () => ({
        url: "calendar/events",
        method: "GET",
      }),
    }),
    createEvent: builder.mutation<
      IPostCalendarEventsResponse,
      IPostCalendarEventsRequest
    >({
      query: ({
        color,
        description,
        startDate,
        endDate,
        title,
        participants,
        gmtDelta,
      }) => ({
        url: "calendar/events",
        method: "POST",
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
    createInstantEvent: builder.mutation<ICreateInstantEventResponse, void>({
      query: () => ({
        url: "calendar/events/instant",
        method: "POST",
        body: {},
      }),
    }),
    deleteEvent: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `calendar/events/${id}`,
        method: "DELETE",
        body: {
          id,
        },
      }),
    }),
    updateEvent: builder.mutation<
      IPutCalendarEventsResponse,
      IPutCalendarEventsRequest
    >({
      query: ({
        id,
        color,
        description,
        endDate,
        gmtDelta,
        participants,
        startDate,
        title,
        status,
      }) => ({
        url: `calendar/events/${id}`,
        method: "PATCH",
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
    getCalendarEventDetails: builder.query<
      IGetCalendarEventDetailsResponse,
      IGetCalendarEventDetailsRequest
    >({
      query: ({ id }) => ({
        url: `calendar/events/${id}`,
        method: "GET",
      }),
    }),
    getCalendarRecent: builder.query<string[], void>({
      query: () => ({
        url: `calendar/recent`,
        method: "GET",
      }),
    }),
    getCalendarTimezones: builder.query<
      ITimezoneOptionsResponse,
      ITimezoneOptionsRequest
    >({
      query: ({ page, limit, term }) => ({
        url: `calendar/timezone-options?page=${page}&limit=${limit}&term=${term}`,
        method: "GET",
      }),
    }),
  }),
})

export const {
  useUpdateEventMutation,
  useDeleteEventMutation,
  useCreateEventMutation,
  useGetCalendarTimezonesQuery,
  useCreateInstantEventMutation,
  useGetCalendarEventsQuery,
  useGetCalendarEventDetailsQuery,
  useGetCalendarRecentQuery,
} = calendarApi
