export const setItemWithExpiry = (key: string, value: any, ttl: number) => {
  const now = new Date()
  const item = {
    value,
    expiry: now.getTime() + ttl,
  }
  localStorage.setItem(key, JSON.stringify(item))
}

export const getItemWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key)
  if (!itemStr) return null

  try {
    const item = JSON.parse(itemStr)
    const now = new Date().getTime()
    if (now > item.expiry) {
      localStorage.removeItem(key)
      return null
    }
    return item.value
  } catch {
    return null
  }
}

export const removeItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Không thể xóa key "${key}" khỏi localStorage:`, error);
  }
};
