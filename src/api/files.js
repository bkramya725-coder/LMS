import client from './client'

// Real file upload, replacing "paste a link" with an actual multipart
// upload to POST /api/files/upload. The `Content-Type: undefined` here is
// a deliberate axios idiom: our client instance sets a default JSON
// Content-Type on every request, which would otherwise override the
// multipart boundary the browser needs to generate for a FormData body.
// Setting it to undefined lets axios/the browser fill in the correct
// "multipart/form-data; boundary=..." header itself.
export const filesApi = {
  upload: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return client
      .post('/files/upload', formData, {
        headers: { 'Content-Type': undefined },
        onUploadProgress: onProgress
          ? (evt) => onProgress(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0)
          : undefined,
      })
      .then((r) => r.data)
  },
}

// The backend returns a relative path like "/uploads/xyz.pdf". Resolve it
// against the API's origin (not the frontend's) so links actually work.
export function absoluteFileUrl(relativeUrl) {
  if (!relativeUrl) return relativeUrl
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl
  const origin = new URL(client.defaults.baseURL).origin
  return origin + relativeUrl
}
