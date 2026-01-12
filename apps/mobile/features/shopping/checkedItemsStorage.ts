import * as SecureStore from 'expo-secure-store'

const CHECKED_ITEMS_KEY = 'shopping_checked_items'

export async function getCheckedItems(): Promise<Set<string>> {
  const stored = await SecureStore.getItemAsync(CHECKED_ITEMS_KEY)
  if (!stored) {
    return new Set()
  }
  const ids: string[] = JSON.parse(stored)
  return new Set(ids)
}

export async function setCheckedItems(checkedIds: Set<string>): Promise<void> {
  const ids = Array.from(checkedIds)
  await SecureStore.setItemAsync(CHECKED_ITEMS_KEY, JSON.stringify(ids))
}

export async function toggleCheckedItem(
  itemId: string,
  currentCheckedIds: Set<string>
): Promise<Set<string>> {
  const newCheckedIds = new Set(currentCheckedIds)
  if (newCheckedIds.has(itemId)) {
    newCheckedIds.delete(itemId)
  } else {
    newCheckedIds.add(itemId)
  }
  await setCheckedItems(newCheckedIds)
  return newCheckedIds
}

export async function clearCheckedItems(): Promise<void> {
  await SecureStore.deleteItemAsync(CHECKED_ITEMS_KEY)
}
