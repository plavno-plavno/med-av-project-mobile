export interface IGetCalendarEventDetailsRequest {
    id: number;
}

export interface IGetCalendarEventDetailsResponse {
    id: number
    startDate: string
    endDate: string;
    title: string;
    gmtDelta: number;
    description: string;
    color: string;
    participants: IParticipants[]
    createdBy: ICreatedBy
}

export interface IRole {
    __entity: string;
    description:string;
    id: number
    name: string;
}

export interface IStatus {
    __entity:string;
    id: number;
    name: string;
}

export interface ICreatedBy {
    __entity: string;
    createdAt: string;
    dateBirth: string | null;
    deletedAt: string | null;
    department: string | null;
    directoryId: number | null;
    email: string;
    firstName: string | null;
    gmtDelta: number;
    id: number;
    isTwoFAEnabled: boolean;
    language: string | null;
    lastName: string | null;
    newEmail: string | null;
    organization: string | null;
    photo: string | null;
    role: IRole;
status: IStatus;
   subscribePlan: string | null;
   title:string;
   updatedAt: string;
}

export interface IUser {
    __entity: string;
    createdAt: string;
    dateBirth: string | null;
    deletedAt:  string | null;
    department:  string | null;
    directoryId: number | null;
    email: string;
    firstName:  string | null;
    gmtDelta: number;
    id: number;
    isTwoFAEnabled: boolean;
    language:  string | null;
    lastName:  string | null;
    newEmail:  string | null;
    organization:  string | null;
    photo:  string | null;
    role: IRole;
    status: IStatus;
    subscribePlan:  string | null;
    title:string;
    updatedAt: string;
}

export interface IParticipants{
    __entity: string;
    createdAt:string;
    id: number;
    status: string;
    updatedAt: string;
    user: IUser;
    email: string
}


export interface IGetCalendarEvents {
    __entity: string;
    color: string;
    createdAt: string;
    createdBy: [Object],
    description:string;
    endDate: string;
    gmtDelta: number;
    hash: string;
    id: number;
    participants: IParticipants[],
    startDate: string;
    status: string;
    title: string;
}

export interface IGetCalendarEventsResponse {
    data: IGetCalendarEvents[];
}

export interface IPostCalendarEventsRequest {
    color?: string;
    description?: string;
    endDate?:string;
    startDate?: string;
    title?: string;
    participants?: string [];
    gmtDelta?: number;
    status?: string
}

export interface IPostCalendarEventsResponse {   
}
export interface IPutCalendarEventsRequest extends IPostCalendarEventsRequest{
    id: number;
}

export interface IPutCalendarEventsResponse {}