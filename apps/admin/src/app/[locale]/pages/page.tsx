import {
  Button,
  DropdownMenu,
  DropdownTrigger,
  DropdownItem,
  DropdownSection,
} from "@heroui/react";
import { MoreHorizontal, Plus } from "lucide-react";
import type { Metadata } from "next";

import { CustomNavbar } from "@/components/custom-navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Pages | E-commerce Aggregation Admin",
  description: "Manage your website pages",
};

export default function PagesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <CustomNavbar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Website Pages</h2>
          <div className="flex items-center space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>{page.url}</TableCell>
                  <TableCell>{page.lastUpdated}</TableCell>
                  <TableCell className="text-center">
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        page.status === "Published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {page.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu aria-label="Actions">
                      <DropdownTrigger>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownItem key="label" isReadOnly>
                        Actions
                      </DropdownItem>
                      <DropdownItem key="edit">Edit</DropdownItem>
                      <DropdownItem key="view">View</DropdownItem>
                      <DropdownSection showDivider>
                        <DropdownItem key="publish">
                          {page.status === "Published"
                            ? "Unpublish"
                            : "Publish"}
                        </DropdownItem>
                        <DropdownItem key="delete" className="text-red-600">
                          Delete
                        </DropdownItem>
                      </DropdownSection>
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

const pages = [
  {
    id: "1",
    title: "Home",
    url: "/",
    lastUpdated: "2025-03-10",
    status: "Published",
  },
  {
    id: "2",
    title: "About Us",
    url: "/about",
    lastUpdated: "2025-03-08",
    status: "Published",
  },
  {
    id: "3",
    title: "Contact",
    url: "/contact",
    lastUpdated: "2025-03-05",
    status: "Published",
  },
  {
    id: "4",
    title: "Terms & Conditions",
    url: "/terms",
    lastUpdated: "2025-02-28",
    status: "Published",
  },
  {
    id: "5",
    title: "Privacy Policy",
    url: "/privacy",
    lastUpdated: "2025-02-28",
    status: "Published",
  },
  {
    id: "6",
    title: "FAQ",
    url: "/faq",
    lastUpdated: "2025-03-12",
    status: "Published",
  },
  {
    id: "7",
    title: "Shipping Information",
    url: "/shipping",
    lastUpdated: "2025-03-01",
    status: "Published",
  },
  {
    id: "8",
    title: "Summer Sale 2025",
    url: "/summer-sale-2025",
    lastUpdated: "2025-03-15",
    status: "Draft",
  },
];
