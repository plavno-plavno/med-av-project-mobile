import { IPostMediaResponse } from "../mediaApi/types"

export interface IAuthMeResponse {
  __entity: "User"
  createdAt: string // ISO date string
  dateBirth: string | null // Nullable ISO date string
  deletedAt: string | null // Nullable ISO date string
  department: string | null
  directoryId: number | null
  email: string
  firstName: string | null
  gmtDelta: number
  id: number
  isTwoFAEnabled: boolean
  language: string | null
  lastName: string | null
  newEmail: string | null
  organization: string | null
  photo: IPostMediaResponse
  provider: "email" | "google" | "facebook" | "twitter" // Extendable provider type
  role: RoleEntity
  socialId: string | null
  status: Status
  subscribePlan: string | null
  title: string
  updatedAt: string // ISO date string
}

export interface RoleEntity {
  __entity: "RoleEntity"
  description: string
  id: number
  name: string
}

export interface Status {
  __entity: "Status"
  id: number
  name: string
}

export interface IUpdateAuthMeRequest {
  photo?: string
  firstName?: string
  lastName?: string
  language?: number
  timezone?: number
  email?: string
  password?: string
  oldPassword?: string
}
export type Photo = {
  id: string;
  path: string;
  link: string;
};

export type Departments = {
  name: string;
};

export interface Organization {
  id: number | string;
  location: string;
  staffCount: string
  phoneNumber: string;

  name: string;
  domain: string;
  updatedAt: string;
  createdAt: string;
  photo: Photo | null;
  departments: any[];
}


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
  language: {
    name: string
  }
  updatedAt: string;
  organization: Organization;
}

export interface Language {
  __entity: "Language"
  code: string
  id: number
  name: string
}

export interface FileEntity {
  __entity: "FileEntity"
  fileType: string
  id: string
  link: string
  name: string
  organizationId: number
  postfix: string
  prefix: string
  sharedWithAll: boolean
  sharedWithOrganization: boolean
  tag: string | null
  type: string
  userId: number
}
