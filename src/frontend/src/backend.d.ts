import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Memories {
    id: bigint;
    title: string;
    date: string;
    description: string;
}
export interface AppSettings {
    anniversaryDate: string;
    friendName: string;
    personalLetter: string;
}
export interface backendInterface {
    addMemory(title: string, date: string, description: string): Promise<bigint>;
    deleteMemory(id: bigint): Promise<void>;
    getAppSettings(): Promise<AppSettings>;
    listMemories(): Promise<Array<Memories>>;
    setAppSettings(settings: AppSettings): Promise<void>;
    updateMemory(id: bigint, title: string, date: string, description: string): Promise<void>;
}
