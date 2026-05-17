import type { AssetRef } from "@rpg3d/schema"

export interface PresignResponse {
  assetId:   string
  uploadUrl: string
  publicUrl: string
}

async function presignAsset(
  apiUrl: string,
  token: string,
  opts: { campaignId: string; fileName: string; mimeType: string; sizeBytes?: number },
): Promise<PresignResponse> {
  const res = await fetch(`${apiUrl}/assets/presign`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify(opts),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Presign falhou (${res.status}): ${body}`)
  }
  return res.json() as Promise<PresignResponse>
}

function uploadToStorage(
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", contentType)
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload  = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload falhou: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error("Erro de rede durante o upload"))
    xhr.send(file)
  })
}

async function confirmAsset(apiUrl: string, token: string, assetId: string): Promise<void> {
  const res = await fetch(`${apiUrl}/assets/confirm`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ assetId }),
  })
  if (!res.ok) throw new Error(`Confirmar asset falhou (${res.status})`)
}

export async function uploadAsset(
  apiUrl: string,
  token: string,
  campaignId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<AssetRef> {
  const mimeType = file.type || "application/octet-stream"
  const presign  = await presignAsset(apiUrl, token, {
    campaignId,
    fileName:  file.name,
    mimeType,
    sizeBytes: file.size,
  })

  await uploadToStorage(presign.uploadUrl, file, mimeType, onProgress)
  await confirmAsset(apiUrl, token, presign.assetId)

  return {
    id:        presign.assetId,
    url:       presign.publicUrl,
    mimeType,
    sizeBytes: file.size,
  }
}

export async function uploadSceneFile(
  apiUrl: string,
  token: string,
  campaignId: string,
  sceneJson: string,
  sceneName: string,
): Promise<string> {
  const mimeType = "application/json"
  const blob     = new Blob([sceneJson], { type: mimeType })
  const fileName = `${sceneName.replace(/[^a-z0-9]/gi, "_")}.rpgscene`

  const presign = await presignAsset(apiUrl, token, {
    campaignId,
    fileName,
    mimeType,
    sizeBytes: blob.size,
  })

  await uploadToStorage(presign.uploadUrl, blob, mimeType)
  await confirmAsset(apiUrl, token, presign.assetId)

  return presign.publicUrl
}
