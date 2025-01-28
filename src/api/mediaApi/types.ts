import { DocumentPickerResponse } from "react-native-document-picker"

export interface IPostMediaRequest {
  file: DocumentPickerResponse
  prefix: string
  postfix: string
  tag?: string
  name?: string
}
export interface IPostMediaResponse {
  organizationId: number
  userId: number
  prefix: string
  postfix: string
  name: string
  type: "FILE"
  fileType: string
  tag: string | null
  id: string
  sharedWithOrganization: boolean
  sharedWithAll: boolean
  link: string
}
