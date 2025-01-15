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
  gmtDelta?: number | string
  email?: string
}

export interface User {
  billingAddress: any[]
  createdAt: string
  dateBirth: string | null
  deletedAt: string | null
  department: string | null
  directoryId: number | null
  email: string
  firstName: string
  gmtDelta: number
  id: number
  isTwoFAEnabled: boolean
  language: Language
  lastName: string
  newEmail: string | null
  organization: string | null
  photo: FileEntity
  provider: string
  role: RoleEntity
  shippingAddress: any[]
  socialId: string | null
  status: Status
  subscribePlan: string | null
  title: string
  updatedAt: string
  widgets: any[]
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
