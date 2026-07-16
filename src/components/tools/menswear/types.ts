export type MenswearMaterial = {
  analysis?: Record<string, unknown>;
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  promptNotes?: string | null;
  sourceType?: string;
  tags: string[];
  rightsStatus: string;
  updatedAt: string;
};

export type MenswearModelProfile = {
  id: string;
  name: string;
  status: string;
  faceLockStrength: number;
  bodyLockStrength: number;
  hairLockStrength: number;
  consentConfirmedAt: string | null;
  images?: Array<{
    material?: MenswearMaterial;
    materialId: string;
    role: string;
  }>;
};

export type DraftReference = {
  materialId: string;
  role: string;
  policy: "LOCKED" | "REPLACE" | "LIMITED" | "SYSTEM" | "REMOVE";
  fidelity: number;
  allowedChanges: string[];
};
