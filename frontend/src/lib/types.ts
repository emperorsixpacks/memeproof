export interface Agent {
  id: number;
  name: string;
  description: string;
  created_by: string;
  created_at: number;
  memory_count: number;
}

export interface MemoryAnchor {
  agent_id: number;
  memory_index: number;
  walrus_blob_id: string;
  content_hash: string;
  size: number;
  mime_type: string;
  description: string;
  timestamp: number;
  created_by: string;
}

export interface UploadResponse {
  walrus_blob_id: string;
  content_hash: string;
  size: number;
}

export interface VerifyResponse {
  match: boolean;
  computed_hash: string;
}
