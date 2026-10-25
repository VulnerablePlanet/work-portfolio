import type { RoomDocument } from '@/domain/room/document';

export type RoomPurpose =
  | 'about'
  | 'projects'
  | 'skills'
  | 'contact'
  | 'lab'
  | 'custom';

export interface PublicRoom {
  slug: string;
  title: string;
  purpose: RoomPurpose;
  document: RoomDocument;
}

export interface PublicSpace {
  handle: string;
  displayName: string;
  headline: string;
  title: string;
  summary: string;
  rooms: PublicRoom[];
}
