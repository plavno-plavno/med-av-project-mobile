export interface IGetCalendarEventDetailsRequest {
  id: number
}

export interface Timezone {
  __entity: "Timezone"
  abbreviation: string
  gmtDelta: number
  id: number
  isDst: boolean
  text: string
  utc: string[]
  value: string
}

export interface IGetCalendarEventDetailsResponse {
  id: number
  startDate: string
  endDate: string
  title: string
  status: "accept" | "decline" | "pending"
  gmtDelta: number
  description: string
  color: string
  participants: IParticipants[]
  createdBy: ICreatedBy
  hash: string
  timezone: Timezone
}

export interface IGetCalendarEventHashResponse
  extends IGetCalendarEventDetailsResponse {
  meetId: string
  createdById: number
}

export interface IRole {
  __entity: string
  description: string
  id: number
  name: string
}

export interface IStatus {
  __entity: string
  id: number
  name: string
}

export interface ICreatedBy {
  __entity: string
  createdAt: string
  dateBirth: string | null
  deletedAt: string | null
  department: string | null
  directoryId: number | null
  email: string
  firstName: string | null
  gmtDelta: number
  id: number
  isTwoFAEnabled: boolean
  inputLanguage: any
  outputLanguage: any
  lastName: string | null
  newEmail: string | null
  organization: string | null
  photo: string | null
  role: IRole
  status: IStatus
  subscribePlan: string | null
  title: string
  updatedAt: string
}

export interface IUser {
  __entity: string
  createdAt: string
  dateBirth: string | null
  deletedAt: string | null
  department: string | null
  directoryId: number | null
  email: string
  firstName: string | null
  gmtDelta: number
  id: number
  isTwoFAEnabled: boolean
  inputLanguage: any
  outputLanguage: any
  lastName: string | null
  newEmail: string | null
  organization: string | null
  photo: string | null
  role: IRole
  status: IStatus
  subscribePlan: string | null
  title: string
  updatedAt: string
}

export interface IParticipants {
  __entity: string
  createdAt: string
  id: number
  status: string
  updatedAt: string
  user: IUser
  email: string
}

export interface IGetCalendarEvents {
  __entity: string
  color: string
  createdAt: string
  createdBy: [Object]
  description: string
  endDate: string
  gmtDelta: number
  hash: string
  id: number
  participants: IParticipants[]
  startDate: string
  status: string
  title: string
}

export interface IGetCalendarEventsResponse {
  data: IGetCalendarEvents[]
}

export interface IPostCalendarEventsRequest {
  color?: string
  description?: string
  endDate?: string
  startDate?: string
  title?: string
  timezone?: {
    id: number | string
  }
  participants?: string[]
  status?: string
}

export interface IPostCalendarEventsResponse {}
export interface ICreateInstantEventResponse {
  hash: string
  createdBy: {
    email: string
  }
}
export interface IPutCalendarEventsRequest extends IPostCalendarEventsRequest {
  id: number
}

export interface IPutCalendarEventsResponse {}

export interface ITimezone {
  id: number
  isDst: boolean
  value: string
  text: string
  gmtDelta: number
  abbreviation: string
  utc: string[]
  __entity: string
}

export interface ITimezoneResponse extends ITimezone {}

export interface ITimezoneOptionsResponse {
  data: ITimezone[]
}

export interface ITimezoneOptionsRequest {
  page: string
  limit: string
  term: string
}

export interface ISaveCalendarEventsLogRequest {
  durationInSeconds: number;
  event: {
    id: number;
  }
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export interface IGetRequestsByEventIdResponse {
  id: number;
  isOwner: boolean;
  color: string;
  createdAt: string;
  createdBy: User;
  description: string;
  startDate: string;
  endDate: string;
  title: string;
  status: string;
  participants: User[];
  socketId: string;
}
