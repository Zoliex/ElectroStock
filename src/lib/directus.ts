import { createDirectus, rest, staticToken } from '@directus/sdk';

export interface Box {
  id: string;
  name: string;
  description: string;
  unique_id: string;
}

export interface ComponentPackage {
  id: number;
  name: string;
}

export interface ComponentType {
  id: number;
  name: string;
  comments: string;
}

export interface ComponentFile {
  id: number;
  components_id: number;
  directus_files_id: string;
}

export interface Component {
  id: number;
  name: string;
  description: string;
  main_image: string; // File ID
  datasheet: string; // File ID
  quantity_available: number;
  location: string | Box; // Box ID or Box object
  url: string | null;
  keywords: string[] | null;
  packet_reference: string | null;
  package: number | ComponentPackage; // Package ID or Package object
  type: number | ComponentType; // Type ID or Type object
  barcode: string | null;
  other_images?: ComponentFile[];
  other_files?: ComponentFile[];
  date_created?: string;
}

export interface Schema {
  boxes: Box[];
  components_packages: ComponentPackage[];
  components_types: ComponentType[];
  components: Component[];
  components_files: ComponentFile[];
  components_files_1: ComponentFile[];
}

const DIRECTUS_URL = typeof window !== 'undefined' ? `${window.location.origin}/directus` : '/directus';
const DIRECTUS_TOKEN = 'FHSqhqx84zCUm3eM-UHpqjISY2bCSDcY';

export const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

export const getFileUrl = (fileId: string) => `${DIRECTUS_URL}/assets/${fileId}?access_token=${DIRECTUS_TOKEN}`;
