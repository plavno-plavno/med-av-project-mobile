export interface IPostMediaRequest {
    files: File;
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