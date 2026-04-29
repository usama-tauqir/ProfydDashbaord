"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

interface Student {
  id: string
  name: string
  email: string
  package: string
  tutor: string
}

const students: Student[] = [
  { id: "1", name: "Ali Khan", email: "ali.khan@example.com", package: "Advanced Math", tutor: "Sara Ahmed" },
  { id: "2", name: "Ayesha Malik", email: "ayesha.malik@example.com", package: "English Fluency", tutor: "Fahad Ali" },
  { id: "3", name: "Hassan Raza", email: "hassan.raza@example.com", package: "Science Basics", tutor: "Nida Tariq" },
]

export default function ActiveStudentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Active Students</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Tutor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(s => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.email}</TableCell>
              <TableCell>{s.package}</TableCell>
              <TableCell>{s.tutor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}