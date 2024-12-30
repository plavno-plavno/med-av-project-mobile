import { Image } from "react-native-image-crop-picker";

export interface IPostMediaRequest {
    files: Image;
    prefix: string;
    postfix: string;
    tag?: string;
}
export interface IPostMediaResponse {
      organizationId: number;
      userId: number;
      prefix: string;
      postfix: string;
      name: string;
      type: "FILE"; 
      fileType: string; 
      tag: string | null; 
      id: string; 
      sharedWithOrganization: boolean;
      sharedWithAll: boolean;
      link: string; 
  }