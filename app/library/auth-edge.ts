export async function verifyTokenEdge(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    
    const secretStr = process.env.JWT_SECRET || 'yts-lms-dev-only-secret-change-in-production-32chars';
    const enc = new TextEncoder();
    const keyMaterial = enc.encode(secretStr);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const base64Signature = signature.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64Signature.length % 4;
    const paddedSignature = pad ? base64Signature + '='.repeat(4 - pad) : base64Signature;
    const binarySignature = atob(paddedSignature);
    const signatureBytes = new Uint8Array(binarySignature.length);
    for (let i = 0; i < binarySignature.length; i++) {
      signatureBytes[i] = binarySignature.charCodeAt(i);
    }
    
    const dataBytes = enc.encode(`${header}.${payload}`);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      dataBytes
    );
    
    if (!isValid) return null;
    
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padPayload = base64Payload.length % 4;
    const paddedPayload = padPayload ? base64Payload + '='.repeat(4 - padPayload) : base64Payload;
    
    const decodedPayload = JSON.parse(
      decodeURIComponent(atob(paddedPayload).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''))
    );
    
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
}
