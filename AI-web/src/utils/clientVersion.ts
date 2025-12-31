let cachedVersion: string | null = null
let cachedName: string | null = null

export function getClientVersion(): string {
  if (cachedVersion) {
    return cachedVersion
  }
  
  try {
    cachedVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
    return cachedVersion
  } catch {
    return '1.0.0'
  }
}

export async function getClientVersionInfo(): Promise<{
  version: string
  name: string
  buildTime: string
}> {
  if (cachedVersion && cachedName) {
    return {
      version: cachedVersion,
      name: cachedName,
      buildTime: new Date().toISOString()
    }
  }

  try {
    const response = await fetch('/client-version.json')
    if (response.ok) {
      const data = await response.json()
      cachedVersion = data.version || '1.0.0'
      cachedName = data.name || '记账管理客户端'
      return {
        version: cachedVersion,
        name: cachedName,
        buildTime: data.buildTime || new Date().toISOString()
      }
    }
  } catch {
    console.warn('无法从client-version.json获取客户端版本信息，使用默认值')
  }

  cachedVersion = getClientVersion()
  cachedName = '记账管理客户端'
  return {
    version: cachedVersion,
    name: cachedName,
    buildTime: new Date().toISOString()
  }
}

export function getClientName(): string {
  if (cachedName) {
    return cachedName
  }
  cachedName = '记账管理客户端'
  return cachedName
}
