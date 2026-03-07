'use client'

import { useState } from 'react'
import { Button } from '#/components/ui/button'

export type EditableListField<T> = {
  key: keyof T
  label?: string
  placeholder?: string
}

type ItemWithId<T> = T & { _id: string }

type EditableListProps<T extends Record<string, unknown>> = {
  initialItems: T[]
  fields: EditableListField<T>[]
  onListChange?: (items: T[]) => void
  addButtonText?: string
  deleteConfirmMessage?: string
  emptyItem: T
}

export function EditableList<T extends Record<string, unknown>>({
  initialItems,
  fields,
  onListChange,
  addButtonText = 'Ajouter',
  deleteConfirmMessage = 'Supprimer cet élément ?',
  emptyItem,
}: EditableListProps<T>) {
  const [list, setList] = useState<ItemWithId<T>[]>(() =>
    initialItems.map((item, i) => ({ ...item, _id: `item-${Date.now()}-${i}` }))
  )

  function updateList(newList: ItemWithId<T>[]) {
    setList(newList)
    const clean = newList.map(({ _id: _id2, ...item }) => item) as unknown as T[]
    onListChange?.(clean)
  }

  function handleChange(id: string, field: keyof T, value: string) {
    updateList(list.map(item => item._id === id ? { ...item, [field]: value } : item))
  }

  function handleDelete(id: string) {
    if (confirm(deleteConfirmMessage)) {
      updateList(list.filter(item => item._id !== id))
    }
  }

  function handleAdd() {
    updateList([...list, { ...emptyItem, _id: `item-${Date.now()}-${list.length}` }])
  }

  return (
    <div className="space-y-1">
      {list.map(item => (
        <div key={item._id} className="flex items-center gap-1">
          {fields.map(field => (
            <input
              key={String(field.key)}
              type="text"
              value={String(item[field.key] ?? '')}
              onChange={e => handleChange(item._id, field.key, e.target.value)}
              placeholder={field.placeholder ?? field.label}
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-0"
            />
          ))}
          <button
            type="button"
            onClick={() => handleDelete(item._id)}
            className="text-red-500 hover:text-red-700 px-1 shrink-0"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={handleAdd} className="mt-2">
        + {addButtonText}
      </Button>
    </div>
  )
}

export function useEditableList<T>(initialItems: T[]): [T[], (items: T[]) => void] {
  const [items, setItems] = useState<T[]>(initialItems)
  return [items, setItems]
}
