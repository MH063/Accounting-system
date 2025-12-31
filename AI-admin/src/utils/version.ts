let cachedVersion: string | null = null
let cachedName: string | null = null

export function getPackageVersion(): string {
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

export async function getVersionInfo(): Promise<{
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
    const response = await fetch('/version.json')
    if (response.ok) {
      const data = await response.json()
      cachedVersion = data.version || '1.0.0'
      cachedName = data.name || '记账管理系统'
      return {
        version: cachedVersion,
        name: cachedName,
        buildTime: data.buildTime || new Date().toISOString()
      }
    }
  } catch {
    console.warn('无法从version.json获取版本信息，使用默认值')
  }

  cachedVersion = getPackageVersion()
  cachedName = '记账管理系统'
  return {
    version: cachedVersion,
    name: cachedName,
    buildTime: new Date().toISOString()
  }
}

export function getSystemName(): string {
  if (cachedName) {
    return cachedName
  }
  cachedName = '记账管理系统'
  return cachedName
}
