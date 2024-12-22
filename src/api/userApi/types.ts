export interface IAuthMeResponse {
    __entity: "User";
    createdAt: string; // ISO date string
    dateBirth: string | null; // Nullable ISO date string
    deletedAt: string | null; // Nullable ISO date string
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
    provider: "email" | "google" | "facebook" | "twitter"; // Extendable provider type
    role: RoleEntity;
    socialId: string | null;
    status: Status;
    subscribePlan: string | null;
    title: string;
    updatedAt: string; // ISO date string
}

export interface RoleEntity {
    __entity: "RoleEntity";
    description: string;
    id: number;
    name: string;
}

export interface Status {
    __entity: "Status";
    id: number;
    name: string;
}
