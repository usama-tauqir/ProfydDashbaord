"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectItem } from "@/components/ui/select"
import type { FormField } from "@/lib/types"

export interface DataFormProps {
  title: string
  description?: string
  fields: FormField[]
  onSubmit: (data: Record<string, unknown>) => void
}

export function DataForm({ title, description, fields, onSubmit }: DataFormProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>(
    Object.fromEntries(fields.map((field) => [field.id ?? field.name ?? "", ""]))
  )

  const handleChange = (id: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(formValues)
      }}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="grid gap-4">
        {fields.map((field) => {
          const fieldKey = field.id ?? field.name ?? ""
          const value = formValues[fieldKey] ?? ""
          return (
            <div key={fieldKey} className="space-y-1">
              <label htmlFor={fieldKey} className="block text-sm font-medium text-foreground">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <Textarea
                  id={fieldKey}
                  value={String(value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => handleChange(fieldKey, event.target.value)}
                />
              ) : field.type === "select" ? (
                <Select
                  value={String(value)}
                  onValueChange={(val) => handleChange(fieldKey, val)}
                >
                  <SelectItem value="">Select {field.label}</SelectItem>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              ) : (
                <Input
                  id={fieldKey}
                  type={field.type === "percentage" ? "number" : field.type}
                  value={String(value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => handleChange(fieldKey, event.target.value)}
                />
              )}
            </div>
          )
        })}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  )
}

export function DataEntryForm(props: DataFormProps) {
  return <DataForm {...props} />
}
