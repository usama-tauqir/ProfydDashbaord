// Add or remove companies from this list.
// Each entry here appears as an option in the signup dropdown.
// The `id` is stored in the database; `name` is what users see.

export interface Company {
  id: string
  name: string
}

export const companies: Company[] = [
  { id: "profyd", name: "Profyd" },
  // Add more companies below:
  { id: "acme", name: "Acme Corp" },
  { id: "globex", name: "Globex" },
]

export function getCompanyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id)
}

export function getCompanyName(id: string): string {
  return getCompanyById(id)?.name ?? id
}
