import { MoreHorizontal, Plus } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";
import { UserNav } from "@/components/user-nav";

export const metadata: Metadata = {
  title: "Brands | E-commerce Aggregation Admin",
  description: "Manage your brands",
};

export default function BrandsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Brands</h2>
          <div className="flex items-center space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-gray-100 p-1 mr-3">
                        <img
                          src={`/placeholder.svg?height=40&width=40&text=${brand.name.charAt(0)}`}
                          alt={brand.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {brand.name}
                    </div>
                  </TableCell>
                  <TableCell>{brand.products}</TableCell>
                  <TableCell>{brand.website}</TableCell>
                  <TableCell className="text-center">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        brand.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {brand.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Deactivate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

const brands = [
  {
    id: "1",
    name: "Nike",
    products: 128,
    website: "nike.com",
    status: "Active",
  },
  {
    id: "2",
    name: "Adidas",
    products: 94,
    website: "adidas.com",
    status: "Active",
  },
  {
    id: "3",
    name: "Puma",
    products: 56,
    website: "puma.com",
    status: "Active",
  },
  {
    id: "4",
    name: "Levi's",
    products: 72,
    website: "levis.com",
    status: "Active",
  },
  {
    id: "5",
    name: "H&M",
    products: 143,
    website: "hm.com",
    status: "Active",
  },
  {
    id: "6",
    name: "Zara",
    products: 167,
    website: "zara.com",
    status: "Active",
  },
  {
    id: "7",
    name: "Ray-Ban",
    products: 38,
    website: "ray-ban.com",
    status: "Inactive",
  },
  {
    id: "8",
    name: "Casio",
    products: 42,
    website: "casio.com",
    status: "Active",
  },
];
