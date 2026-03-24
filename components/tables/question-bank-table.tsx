"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedImportRow } from "@/lib/types";

const columns: ColumnDef<ParsedImportRow>[] = [
  {
    accessorKey: "question_text",
    header: "Question"
  },
  {
    accessorKey: "subject",
    header: "Subject"
  },
  {
    accessorKey: "topic",
    header: "Topic"
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => <Badge className="capitalize">{row.original.difficulty}</Badge>
  }
];

export function QuestionBankTable({ data }: { data: ParsedImportRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search questions, subjects, or topics..."
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
      />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext()) ?? String(cell.getValue() ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
